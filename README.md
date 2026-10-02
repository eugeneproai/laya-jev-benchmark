# ⚡ Laya vs Jev — System One Benchmark Telemetry Suite

A high-performance benchmark and telemetry web application comparing **Laya** (local System One neural decision engine) against **Jev** (TypeSafe AI's cloud System One model) across all 10 architectural levels and 30 curated scenarios.

---

## 🌐 Features

1. **Bilingual UI (English / Русский)**:
   - Instant language switch button in the header (`EN / РУС`).
   - Complete translations for all 10 levels, 30 scenarios, idea descriptions, technical metrics, and UI controls.

2. **Zero-HTTP Local Laya Engine (Apple Silicon GPU / MPS)**:
   - **Can we use `laya-mcp-server` instead of API calls? YES!**
   - We implemented a resident Python worker (`server/laya_worker.py`) that utilizes `laya.mcp.tools` / `laya.Router` directly from `.venv` via `stdio`.
   - **Why this is superior to HTTP**:
     - **Sub-50ms execution** on Apple Silicon Metal Performance Shaders (`mps`).
     - **Zero HTTP network overhead** and no port collision issues.
     - **No missing package blockers** (runs immediately without needing `uvicorn` or `mcp` extras).
     - Full support for `laya-mcp-server` and `http://127.0.0.1:8085` via the in-app Settings modal.

3. **Live Telemetry & Analytics**:
   - **Latency breakdown**: Sub-millisecond execution times, TTFB, and visual comparison bars.
   - **Speedup multiplier**: Automatic calculation of latency delta and efficiency gain.
   - **Decision alignment**: Automatic `MATCH` vs `DIVERGENT` detection, probability distributions, and confidence comparison.
   - **Token metrics**: Exact input and output token counts.
   - **Side-by-side JSON diff inspector**: Inspect raw response payloads side-by-side with one-click copy.

4. **Automated Batch Runners**:
   - **Run Level Suite (3 Tests)**: Runs all options of current level back-to-back.
   - **Run All 30 Tests**: Complete automated test run across all 10 levels with real-time progress bar.

5. **Benchmark Fixture Repository**:
   - Built-in sample files in `fixtures/` for Levels 8–10 (database migrations, YAML configs, legacy code, multi-file codebases, build failure logs, security PR diffs).
   - In-app file viewer with "Load File Into State" capability.

6. **History & Persistence**:
   - Automatically stores benchmark runs in browser `localStorage`.
   - One-click export to **JSON**, **CSV**, or **Markdown** benchmark reports.

---

## 🚀 Quick Start

### 1. Start the Server
```bash
node server/server.mjs
```
The server will start on `http://localhost:3000`.

### 2. Open the Web Console
Visit:
```
http://localhost:3000
```

### 3. Configure Jev Cloud API Key (Optional)
Click **Settings** (⚙️) in the top-right header and paste your TypeSafe AI Bearer key, or export it in your environment:
```bash
export TYPESAFE_API_KEY="your-api-key"
```