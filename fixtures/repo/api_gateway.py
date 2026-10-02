# api_gateway.py
from aiohttp import web
import json

async def handle_ping(request):
    return web.Response(text="pong")

async def handle_proxy(request):
    target = request.query.get("target")
    # POTENTIAL SSRF: Directly fetching target without allowlist validation
    async with request.app['client'].get(target) as resp:
        body = await resp.text()
        return web.Response(text=body)
