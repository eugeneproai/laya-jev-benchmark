#!/usr/bin/env python3
"""Laya resident worker process.

Communicates with the Node.js backend over stdin/stdout using newline-delimited JSON.
Keeps checkpoints warm in memory (MPS / CPU) for ultra-low latency inference without
re-importing torch or re-loading models on every request.
"""

import sys
import os
import time
import json
import traceback

# Avoid buffering on stdout so messages reach Node immediately
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

try:
    import laya
    from laya import Router
    from laya.mcp.tools import laya_status, laya_predict, laya_predict_batch, laya_route
    LAYA_AVAILABLE = True
except Exception as e:
    LAYA_AVAILABLE = False
    IMPORT_ERROR = str(e)

router_instance = None
current_device = os.environ.get("LAYA_DEVICE", "mps")

def get_router(device=None):
    global router_instance, current_device
    target_device = device or current_device
    if router_instance is None or target_device != current_device:
        current_device = target_device
        # Initialize Router
        try:
            router_instance = Router(device=target_device)
        except Exception as e:
            # Fallback to CPU if MPS fails
            sys.stderr.write(f"[laya_worker] Device {target_device} failed: {e}. Falling back to CPU.\n")
            current_device = "cpu"
            router_instance = Router(device="cpu")
    return router_instance

def handle_request(req):
    req_id = req.get("id", "default")
    action = req.get("action", "predict")
    
    if not LAYA_AVAILABLE:
        return {
            "id": req_id,
            "status": "error",
            "error": f"Laya library import failed: {IMPORT_ERROR}"
        }
        
    try:
        if action == "status" or action == "ping":
            st = laya_status()
            return {
                "id": req_id,
                "status": "ok",
                "device": current_device,
                "version": getattr(laya, "__version__", "unknown"),
                "details": st
            }
            
        elif action == "predict":
            state = req.get("state", {})
            questions = req.get("questions", {})
            model = req.get("model", "auto")
            device_req = req.get("device", current_device)
            r = get_router(device_req)
            
            t0 = time.perf_counter()
            res = r.predict(
                state=state,
                questions=questions,
                model=model if model != "auto" else None
            )
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            
            # Format answers cleanly
            answers = res.get("answers", {})
            usage = res.get("usage", {"input_tokens": 0, "output_tokens": 0})
            routing = res.get("routing", {})
            
            return {
                "id": req_id,
                "status": "ok",
                "model": res.get("model", "laya-local"),
                "answers": answers,
                "usage": usage,
                "routing": routing,
                "latency_ms": round(elapsed_ms, 2),
                "device": current_device
            }
            
        elif action == "predict_batch":
            requests = req.get("requests", [])
            batch_size = req.get("batch_size", None)
            device_req = req.get("device", current_device)
            r = get_router(device_req)
            
            t0 = time.perf_counter()
            res = laya_predict_batch(requests=requests, batch_size=batch_size, router=r)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            
            return {
                "id": req_id,
                "status": "ok",
                "result": res,
                "latency_ms": round(elapsed_ms, 2),
                "device": current_device
            }
            
        elif action == "route":
            state = req.get("state", {})
            questions = req.get("questions", {})
            model = req.get("model", None)
            r = get_router()
            
            t0 = time.perf_counter()
            res = laya_route(state=state, questions=questions, model=model, router=r)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            
            return {
                "id": req_id,
                "status": "ok",
                "result": res,
                "latency_ms": round(elapsed_ms, 2)
            }
            
        else:
            return {
                "id": req_id,
                "status": "error",
                "error": f"Unknown action: {action}"
            }
            
    except Exception as e:
        return {
            "id": req_id,
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def main():
    sys.stderr.write("[laya_worker] Worker starting. Warming up router...\n")
    try:
        r = get_router()
        # Warmup forward pass so first real user request is sub-100ms
        r.predict(
            state={"warmup": "init"},
            questions={"ready": {"type": "noul", "instructions": "System ready?"}}
        )
        sys.stderr.write(f"[laya_worker] Router warm and ready on device '{current_device}'. Listening on stdin.\n")
    except Exception as e:
        sys.stderr.write(f"[laya_worker] Warmup warning: {e}\n")

    # Ready signal to parent process
    print(json.dumps({"type": "worker_ready", "device": current_device}))

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            res = handle_request(req)
            print(json.dumps(res))
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "error": f"Failed to parse line: {str(e)}"
            }))

if __name__ == "__main__":
    main()
