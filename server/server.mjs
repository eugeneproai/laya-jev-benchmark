import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3000;
const VENV_PYTHON = path.join(ROOT_DIR, '.venv', 'bin', 'python');

const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(/^([\w.-]+)\s*=\s*(.*)?$/);
      if (m) {
        const k = m[1];
        let v = m[2] || '';
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch (e) {
    console.warn('[server] Error reading .env:', e);
  }
}

let jevApiKey = process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || '';
let jevBaseUrl = process.env.JEV_BASE_URL || 'https://api.typesafe.ai/v1/systemone';
let layaHttpUrl = process.env.LAYA_HTTP_URL || 'http://127.0.0.1:8085/v1/systemone';
let layaMode = 'worker'; // 'worker' (local python stdio) or 'http' (http://127.0.0.1:8085)

// Resident Laya Worker Process Management
let layaWorker = null;
let isWorkerReady = false;
let workerDevice = 'mps';
const pendingRequests = new Map();

function startLayaWorker() {
  if (layaWorker) {
    try { layaWorker.kill(); } catch (e) {}
  }

  console.log(`[server] Spawning Laya resident worker (${VENV_PYTHON} server/laya_worker.py)...`);
  
  layaWorker = spawn(VENV_PYTHON, [path.join(__dirname, 'laya_worker.py')], {
    cwd: ROOT_DIR,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';

  layaWorker.stdout.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let lines = buffer.split('\n');
    buffer = lines.pop(); // keep last incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed);
        if (msg.type === 'worker_ready') {
          isWorkerReady = true;
          workerDevice = msg.device || 'mps';
          console.log(`[server] Laya worker READY on device '${workerDevice}'`);
          continue;
        }

        const id = msg.id;
        if (id && pendingRequests.has(id)) {
          const { resolve } = pendingRequests.get(id);
          pendingRequests.delete(id);
          resolve(msg);
        }
      } catch (err) {
        console.error('[server] Failed to parse worker output:', trimmed, err);
      }
    }
  });

  layaWorker.stderr.on('data', (chunk) => {
    process.stderr.write(`[laya_worker:stderr] ${chunk}`);
  });

  layaWorker.on('exit', (code, signal) => {
    console.warn(`[server] Laya worker exited with code ${code}, signal ${signal}. Restarting in 2s...`);
    isWorkerReady = false;
    setTimeout(startLayaWorker, 2000);
  });
}

startLayaWorker();

function sendToLayaWorker(payload) {
  return new Promise((resolve, reject) => {
    const id = payload.id || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    payload.id = id;

    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Laya worker request timed out after 30s'));
      }
    }, 30000);

    pendingRequests.set(id, {
      resolve: (data) => {
        clearTimeout(timeout);
        resolve(data);
      },
      reject: (err) => {
        clearTimeout(timeout);
        reject(err);
      }
    });

    if (!layaWorker || !layaWorker.stdin.writable) {
      clearTimeout(timeout);
      pendingRequests.delete(id);
      return reject(new Error('Laya worker process is not running or stdin is closed'));
    }

    layaWorker.stdin.write(JSON.stringify(payload) + '\n');
  });
}

// Call Jev API
async function callJevApi(payload, clientKey) {
  const token = clientKey || jevApiKey;
  if (!token) {
    throw new Error('Jev API Key is required. Please open Settings (⚙️ in top-right) and enter your TypeSafe AI API key.');
  }

  const startTime = performance.now();
  let ttfb = 0;

  try {
    const res = await fetch(jevBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    ttfb = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errText = await res.text();
      let errJson = null;
      try { errJson = JSON.parse(errText); } catch (e) {}
      const msg = errJson?.detail?.message || errJson?.message || errText || res.statusText;
      const errType = errJson?.detail?.error_type || '';
      throw new Error(`Jev API Error (${res.status}${errType ? ` - ${errType}` : ''}): ${msg}`);
    }

    const data = await res.json();
    const totalLatency = Math.round(performance.now() - startTime);

    return {
      ...data,
      latency_ms: totalLatency,
      ttfb_ms: ttfb,
      endpoint: jevBaseUrl
    };
  } catch (err) {
    if (err.cause?.code === 'ENOTFOUND' || err.message?.includes('fetch failed')) {
      throw new Error(`Network failure reaching TypeSafe API (${jevBaseUrl}): ${err.cause?.message || err.message}. Verify internet connectivity or proxy settings.`);
    }
    throw err;
  }
}

// MIME types map
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8',
  '.py': 'text/plain; charset=UTF-8',
  '.yaml': 'text/plain; charset=UTF-8',
  '.diff': 'text/plain; charset=UTF-8',
  '.log': 'text/plain; charset=UTF-8'
};

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Jev-Key, X-Laya-Mode');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Helpers
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify(data));
  };

  const readBody = () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(new Error('Invalid JSON in request body'));
        }
      });
      req.on('error', reject);
    });
  };

  try {
    // API Routes
    if (pathname === '/api/health') {
      let layaStatus = { ready: isWorkerReady, device: workerDevice, mode: layaMode };
      try {
        const wrk = await sendToLayaWorker({ action: 'ping' });
        layaStatus = { ...layaStatus, ...wrk, ready: true };
      } catch (e) {
        layaStatus.ready = false;
        layaStatus.error = e.message;
      }

      sendJson(200, {
        status: 'ok',
        laya: layaStatus,
        jev: {
          hasKey: Boolean(jevApiKey),
          baseUrl: jevBaseUrl
        }
      });
      return;
    }

    if (pathname === '/api/settings' && req.method === 'POST') {
      const body = await readBody();
      if (body.jevApiKey !== undefined) jevApiKey = body.jevApiKey;
      if (body.layaMode !== undefined) layaMode = body.layaMode;
      if (body.layaHttpUrl !== undefined) layaHttpUrl = body.layaHttpUrl;
      return sendJson(200, {
        status: 'ok',
        message: 'Settings updated',
        jevApiKeyConfigured: Boolean(jevApiKey),
        layaMode
      });
    }

    if (pathname === '/api/bench/laya' && req.method === 'POST') {
      const body = await readBody();
      const requestedMode = req.headers['x-laya-mode'] || layaMode;

      if (requestedMode === 'http') {
        // HTTP proxy to laya-serve
        const t0 = performance.now();
        const r = await fetch(layaHttpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const elapsed = Math.round(performance.now() - t0);
        if (!r.ok) {
          const errText = await r.text();
          return sendJson(r.status, { error: `Laya HTTP error: ${errText}` });
        }
        const data = await r.json();
        return sendJson(200, { ...data, latency_ms: elapsed, mode: 'http' });
      }

      // Default: resident Python worker (ultra fast, zero network overhead)
      const resp = await sendToLayaWorker({
        action: 'predict',
        state: body.state,
        questions: body.questions,
        model: body.model || 'auto'
      });

      if (resp.status === 'error') {
        return sendJson(500, { error: resp.error, traceback: resp.traceback });
      }
      return sendJson(200, { ...resp, mode: 'worker' });
    }

    if (pathname === '/api/bench/jev' && req.method === 'POST') {
      const body = await readBody();
      const clientKey = req.headers['x-jev-key'] || req.headers['authorization']?.replace('Bearer ', '');
      try {
        const result = await callJevApi(body, clientKey);
        return sendJson(200, result);
      } catch (err) {
        return sendJson(502, { error: err.message });
      }
    }

    if (pathname === '/api/bench/compare' && req.method === 'POST') {
      const body = await readBody();
      const clientKey = req.headers['x-jev-key'] || req.headers['authorization']?.replace('Bearer ', '');
      
      const payload = {
        state: body.state,
        questions: body.questions,
        model: body.model || 'auto'
      };

      // Run both Laya and Jev concurrently
      const [layaRes, jevRes] = await Promise.allSettled([
        sendToLayaWorker({
          action: 'predict',
          state: payload.state,
          questions: payload.questions,
          model: payload.model
        }),
        callJevApi({
          state: payload.state,
          questions: payload.questions,
          model: 'jev-latest'
        }, clientKey)
      ]);

      const result = {
        laya: layaRes.status === 'fulfilled' ? layaRes.value : { error: layaRes.reason?.message },
        jev: jevRes.status === 'fulfilled' ? jevRes.value : { error: jevRes.reason?.message },
        comparison: null
      };

      // If both completed, compute comparison analytics
      if (layaRes.status === 'fulfilled' && jevRes.status === 'fulfilled' &&
          !result.laya.error && !result.jev.error) {
        const layaAns = result.laya.answers || {};
        const jevAns = result.jev.answers || {};

        let agreementCount = 0;
        let totalCount = 0;
        const questionDiffs = {};

        for (const [qKey, qVal] of Object.entries(payload.questions)) {
          totalCount++;
          const lAns = layaAns[qKey];
          const jAns = jevAns[qKey];
          const type = qVal.type;

          let agrees = false;
          let diffInfo = { type, laya: lAns, jev: jAns };

          if (type === 'noul') {
            const lNoul = lAns?.noul ?? 0;
            const jNoul = jAns?.noul ?? 0;
            const delta = Math.abs(lNoul - jNoul);
            agrees = (lNoul >= 0.5) === (jNoul >= 0.5);
            diffInfo.delta = Number(delta.toFixed(3));
            diffInfo.verdictAgree = agrees;
          } else if (type === 'choice') {
            agrees = (lAns?.choice === jAns?.choice);
            diffInfo.layaChoice = lAns?.choice;
            diffInfo.jevChoice = jAns?.choice;
            diffInfo.verdictAgree = agrees;
          } else if (type === 'score') {
            const lScore = lAns?.score ?? 0;
            const jScore = jAns?.score ?? 0;
            const delta = Math.abs(lScore - jScore);
            agrees = delta < 0.5;
            diffInfo.delta = Number(delta.toFixed(2));
            diffInfo.verdictAgree = agrees;
          }

          if (agrees) agreementCount++;
          questionDiffs[qKey] = diffInfo;
        }

        const layaLat = result.laya.latency_ms || 1;
        const jevLat = result.jev.latency_ms || 1;
        const speedup = (jevLat / layaLat).toFixed(1);

        result.comparison = {
          agreementRate: totalCount > 0 ? Math.round((agreementCount / totalCount) * 100) : 0,
          winner: layaLat < jevLat ? 'laya' : 'jev',
          latencySpeedupRatio: Number(speedup),
          latencyDeltaMs: jevLat - layaLat,
          layaLatencyMs: layaLat,
          jevLatencyMs: jevLat,
          questionDiffs,
          tokens: {
            laya: result.laya.usage || { input_tokens: 0, output_tokens: 0 },
            jev: result.jev.usage || { input_tokens: 0, output_tokens: 0 }
          }
        };
      }

      return sendJson(200, result);
    }

    if (pathname === '/api/bench/batch' && req.method === 'POST') {
      const body = await readBody();
      const clientKey = req.headers['x-jev-key'] || req.headers['authorization']?.replace('Bearer ', '');
      const filesRaw = body.files || [];
      const questions = body.questions || {};
      const model = body.model || 'auto';
      const target = body.target || 'compare'; // 'compare' | 'laya' | 'jev'

      // Resolve file contents from disk if not directly provided
      const resolvedFiles = filesRaw.map(item => {
        const relPath = typeof item === 'string' ? item : item.path;
        let content = (typeof item === 'object' && item.content !== undefined) ? item.content : null;
        if (content === null && relPath) {
          const safePath = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
          const fullPath = path.join(ROOT_DIR, 'fixtures', safePath);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            content = fs.readFileSync(fullPath, 'utf8');
          } else {
            content = '';
          }
        }
        return {
          path: relPath,
          name: path.basename(relPath),
          content: content || ''
        };
      });

      if (resolvedFiles.length === 0) {
        return sendJson(400, { error: 'No files provided for batch execution' });
      }

      const layaRequests = resolvedFiles.map(f => ({
        state: { file_path: f.path, file_content: f.content },
        questions,
        model
      }));

      const startTime = performance.now();
      const runLaya = target === 'compare' || target === 'laya';
      const runJev = target === 'compare' || target === 'jev';

      const [layaBatchRes, jevBatchRes] = await Promise.allSettled([
        runLaya
          ? sendToLayaWorker({ action: 'predict_batch', requests: layaRequests, model })
          : Promise.resolve(null),
        runJev
          ? Promise.all(resolvedFiles.map(async f => {
              const fStart = performance.now();
              try {
                const jRes = await callJevApi({
                  state: { file_path: f.path, file_content: f.content },
                  questions,
                  model: 'jev-latest'
                }, clientKey);
                return {
                  path: f.path,
                  answers: jRes.answers,
                  latency_ms: Math.round(performance.now() - fStart)
                };
              } catch (err) {
                return {
                  path: f.path,
                  error: err.message,
                  latency_ms: Math.round(performance.now() - fStart)
                };
              }
            }))
          : Promise.resolve(null)
      ]);

      const layaValue = layaBatchRes.status === 'fulfilled' ? layaBatchRes.value : { error: layaBatchRes.reason?.message };
      const jevValue = jevBatchRes.status === 'fulfilled' ? jevBatchRes.value : { error: jevBatchRes.reason?.message };

      const layaItems = layaValue?.result?.requests || [];
      const jevItems = Array.isArray(jevValue) ? jevValue : [];

      let totalAgreed = 0;
      let totalQuestions = 0;

      const fileResults = resolvedFiles.map((f, i) => {
        const lEntry = layaItems[i] || {};
        const jEntry = jevItems[i] || {};
        const lAns = lEntry.answers || {};
        const jAns = jEntry.answers || {};

        const qDiffs = {};
        let fileAgreed = true;

        for (const [qKey, qVal] of Object.entries(questions)) {
          totalQuestions++;
          const lA = lAns[qKey];
          const jA = jAns[qKey];
          const type = qVal.type;

          let agrees = false;
          if (type === 'noul') {
            const lNoul = lA?.noul ?? 0;
            const jNoul = jA?.noul ?? 0;
            agrees = (lNoul >= 0.5) === (jNoul >= 0.5);
            qDiffs[qKey] = { type, laya: lA, jev: jA, verdictAgree: agrees, delta: Number(Math.abs(lNoul - jNoul).toFixed(3)) };
          } else if (type === 'choice') {
            agrees = (lA?.choice === jA?.choice);
            qDiffs[qKey] = { type, laya: lA, jev: jA, verdictAgree: agrees, layaChoice: lA?.choice, jevChoice: jA?.choice };
          } else if (type === 'score') {
            const lScore = lA?.score ?? 0;
            const jScore = jA?.score ?? 0;
            agrees = Math.abs(lScore - jScore) < 0.5;
            qDiffs[qKey] = { type, laya: lA, jev: jA, verdictAgree: agrees, delta: Number(Math.abs(lScore - jScore).toFixed(2)) };
          }
          if (agrees) totalAgreed++;
          else fileAgreed = false;
        }

        return {
          path: f.path,
          name: f.name,
          sizeBytes: f.content.length,
          snippet: f.content.slice(0, 300),
          laya: {
            answers: lAns,
            routing: lEntry.routing,
            device: lEntry.device || layaValue?.device
          },
          jev: {
            answers: jAns,
            error: jEntry.error
          },
          agreed: fileAgreed,
          diffs: qDiffs
        };
      });

      const totalElapsed = Math.round(performance.now() - startTime);
      const layaTotalLat = layaValue?.latency_ms || layaValue?.result?.total_latency_ms || 1;
      const jevMaxLat = Array.isArray(jevItems) && jevItems.length > 0
        ? Math.max(...jevItems.map(j => j.latency_ms || 0), 1)
        : 1;

      return sendJson(200, {
        mode: 'batch',
        target,
        files: fileResults,
        totalFiles: resolvedFiles.length,
        totalLatencyMs: totalElapsed,
        laya: {
          totalLatencyMs: layaTotalLat,
          perFileLatencyMs: Number((layaTotalLat / resolvedFiles.length).toFixed(1)),
          device: layaValue?.device || 'mps',
          error: layaValue?.error
        },
        jev: {
          totalLatencyMs: jevMaxLat,
          perFileLatencyMs: Number((jevMaxLat / resolvedFiles.length).toFixed(1)),
          error: jevValue?.error || (jevItems.find(j => j.error)?.error)
        },
        comparison: {
          agreementRate: totalQuestions > 0 ? Math.round((totalAgreed / totalQuestions) * 100) : 0,
          speedupRatio: Number((jevMaxLat / Math.max(layaTotalLat, 1)).toFixed(1)),
          throughputLaya: Number((resolvedFiles.length / (layaTotalLat / 1000)).toFixed(1)),
          winner: layaTotalLat < jevMaxLat ? 'laya' : 'jev'
        }
      });
    }

    if (pathname === '/api/fixtures') {
      const fixturesDir = path.join(ROOT_DIR, 'fixtures');
      const getFiles = (dir, prefix = '') => {
        let results = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const rel = path.join(prefix, item.name);
          const full = path.join(dir, item.name);
          if (item.isDirectory()) {
            results = results.concat(getFiles(full, rel));
          } else {
            const stat = fs.statSync(full);
            results.push({
              path: rel,
              name: item.name,
              size: stat.size,
              ext: path.extname(item.name)
            });
          }
        }
        return results;
      };

      const files = getFiles(fixturesDir);
      return sendJson(200, { files });
    }

    if (pathname === '/api/fixtures/read') {
      const relPath = url.searchParams.get('path');
      if (!relPath) return sendJson(400, { error: 'Missing path query parameter' });

      // Guard against path traversal
      const safePath = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
      const fullPath = path.join(ROOT_DIR, 'fixtures', safePath);
      if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        return sendJson(404, { error: 'File not found' });
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      return sendJson(200, { path: safePath, content });
    }

    // Static file serving
    let filePath = '';
    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(ROOT_DIR, 'index.html');
    } else if (pathname.startsWith('/src/')) {
      filePath = path.join(ROOT_DIR, pathname);
    } else if (pathname.startsWith('/fixtures/')) {
      filePath = path.join(ROOT_DIR, pathname);
    } else if (pathname.startsWith('/public/')) {
      filePath = path.join(ROOT_DIR, pathname);
    } else {
      filePath = path.join(ROOT_DIR, 'public', pathname);
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  } catch (err) {
    console.error('[server] Uncaught request error:', err);
    sendJson(500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`🚀 Laya vs Jev Benchmark Telemetry Server running on:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Laya Local Engine: Python stdio resident worker (MPS/CPU)`);
  console.log(`   Jev Target: https://api.typesafe.ai/v1/systemone`);
  console.log(`============================================================\n`);
});
