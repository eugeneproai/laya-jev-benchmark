/**
 * Laya vs Jev Benchmark Telemetry — Main Application Controller
 * ES Module logic handling state, bilingual rendering, API benchmarking, and telemetry.
 */

import { BENCHMARK_LEVELS } from './data/benchmarks.js';
import { getLang, setLang, toggleLang, t, subscribeLang } from './i18n.js';

// Application State
let currentLevelIdx = 0;
let currentOptionIdx = 0;
let benchmarkHistory = JSON.parse(localStorage.getItem('laya_bench_history') || '[]');
let currentFixtures = [];
let currentBatchFiles = [];
let selectedFixturePath = null;
let lastComparisonResult = null;
let isBatchRunning = false;

// DOM Element References
const elements = {
  // Brand & Header
  appTitle: document.getElementById('header-app-title'),
  appSubtitle: document.getElementById('header-app-subtitle'),
  layaStatusPill: document.getElementById('laya-status-pill'),
  layaStatusDot: document.getElementById('laya-status-dot'),
  layaStatusText: document.getElementById('laya-status-text'),
  jevStatusPill: document.getElementById('jev-status-pill'),
  jevStatusDot: document.getElementById('jev-status-dot'),
  jevStatusText: document.getElementById('jev-status-text'),
  langToggleBtn: document.getElementById('lang-toggle-btn'),
  langLabel: document.getElementById('lang-label'),
  sidebarLevelsList: document.getElementById('sidebar-levels-list'),
  sidebarLevelsTitle: document.getElementById('sidebar-levels-title'),

  // Level Banner & Scenario Tabs
  bannerLevelTitle: document.getElementById('banner-level-title'),
  bannerConceptText: document.getElementById('banner-concept-text'),
  bannerLevelDesc: document.getElementById('banner-level-desc'),
  scenarioTabsContainer: document.getElementById('scenario-tabs-container'),
  scenarioDescCard: document.getElementById('scenario-desc-card'),
  scenarioDescBadge: document.getElementById('scenario-desc-badge'),
  scenarioSchemaBadge: document.getElementById('scenario-schema-badge'),
  scenarioDescTitle: document.getElementById('scenario-desc-title'),
  scenarioDescText: document.getElementById('scenario-desc-text'),

  // Action Buttons
  runLayaBtn: document.getElementById('run-laya-btn'),
  runJevBtn: document.getElementById('run-jev-btn'),
  runCompareBtn: document.getElementById('run-compare-btn'),
  runLevelSuiteBtn: document.getElementById('run-level-suite-btn'),
  runAllSuiteBtn: document.getElementById('run-all-suite-btn'),
  btnTextRunLaya: document.getElementById('btn-text-run-laya'),
  btnTextRunJev: document.getElementById('btn-text-run-jev'),
  btnTextCompare: document.getElementById('btn-text-compare'),
  btnTextRunLevelSuite: document.getElementById('btn-text-run-level-suite'),
  btnTextRunAllSuite: document.getElementById('btn-text-run-all-suite'),
  btnTextFixtures: document.getElementById('btn-text-fixtures'),
  btnTextHistory: document.getElementById('btn-text-history'),
  btnTextSettings: document.getElementById('btn-text-settings'),
  btnTextResetPreset: document.getElementById('btn-text-reset-preset'),
  resetPresetBtn: document.getElementById('reset-preset-btn'),

  // Batch Runner Progress
  batchRunnerBanner: document.getElementById('batch-runner-banner'),
  batchStatusTitle: document.getElementById('batch-status-title'),
  batchStatusSub: document.getElementById('batch-status-sub'),
  batchProgressTrack: document.getElementById('batch-progress-track'),
  batchProgressBar: document.getElementById('batch-progress-bar'),

  // Playground Inputs
  singlePlaygroundSection: document.getElementById('single-playground-section'),
  batchPlaygroundSection: document.getElementById('batch-playground-section'),
  playgroundScenarioContext: document.getElementById('playground-scenario-context'),
  playgroundScenarioLabel: document.getElementById('playground-scenario-label'),
  playgroundScenarioDesc: document.getElementById('playground-scenario-desc'),
  labelPlaygroundTitle: document.getElementById('label-playground-title'),
  labelStateInput: document.getElementById('label-state-input'),
  labelQuestionsInput: document.getElementById('label-questions-input'),
  inputStateJson: document.getElementById('input-state-json'),
  inputQuestionsJson: document.getElementById('input-questions-json'),
  labelBatchFilesTitle: document.getElementById('label-batch-files-title'),
  batchFilesCountBadge: document.getElementById('batch-files-count-badge'),
  batchFilesContainer: document.getElementById('batch-files-container'),
  labelBatchQuestionsInput: document.getElementById('label-batch-questions-input'),
  batchQuestionsJson: document.getElementById('batch-questions-json'),

  // Results Containers
  singleResultsContainer: document.getElementById('single-results-container'),
  batchResultsContainer: document.getElementById('batch-results-container'),
  batchStatsSummary: document.getElementById('batch-stats-summary'),
  batchLayaTime: document.getElementById('batch-laya-time'),
  batchJevTime: document.getElementById('batch-jev-time'),
  batchSpeedupVal: document.getElementById('batch-speedup-val'),
  batchThroughputVal: document.getElementById('batch-throughput-val'),
  labelBatchMatrixTitle: document.getElementById('label-batch-matrix-title'),
  batchMatrixList: document.getElementById('batch-matrix-list'),

  // Telemetry Outputs
  labelTelemetryTitle: document.getElementById('label-telemetry-title'),
  telemetryTimestamp: document.getElementById('telemetry-timestamp'),
  layaLatencyVal: document.getElementById('laya-latency-val'),
  layaModelVal: document.getElementById('laya-model-val'),
  layaTokensVal: document.getElementById('laya-tokens-val'),
  layaDeviceBadge: document.getElementById('laya-device-badge'),
  jevLatencyVal: document.getElementById('jev-latency-val'),
  jevTtfbVal: document.getElementById('jev-ttfb-val'),
  jevTokensVal: document.getElementById('jev-tokens-val'),
  winnerCard: document.getElementById('winner-card'),
  winnerIcon: document.getElementById('winner-icon'),
  winnerStatement: document.getElementById('winner-statement'),
  speedupBadge: document.getElementById('speedup-badge'),
  latencyBarContainer: document.getElementById('latency-bar-container'),
  barFillLaya: document.getElementById('bar-fill-laya'),
  barFillJev: document.getElementById('bar-fill-jev'),
  barMsLaya: document.getElementById('bar-ms-laya'),
  barMsJev: document.getElementById('bar-ms-jev'),
  labelAnswersTitle: document.getElementById('label-answers-title'),
  decisionsList: document.getElementById('decisions-list'),
  metricLblModel: document.getElementById('metric-lbl-model'),
  metricLblTokens: document.getElementById('metric-lbl-tokens'),
  metricLblTtfb: document.getElementById('metric-lbl-ttfb'),
  metricLblJevTokens: document.getElementById('metric-lbl-jev-tokens'),

  // Raw Diff Card
  labelDiffTitle: document.getElementById('label-diff-title'),
  btnTextCopyJson: document.getElementById('btn-text-copy-json'),
  copyDiffBtn: document.getElementById('copy-diff-btn'),
  rawJsonLaya: document.getElementById('raw-json-laya'),
  rawJsonJev: document.getElementById('raw-json-jev'),

  // Modals
  settingsModal: document.getElementById('settings-modal'),
  openSettingsBtn: document.getElementById('open-settings-btn'),
  closeSettingsModalBtn: document.getElementById('close-settings-modal-btn'),
  cancelSettingsBtn: document.getElementById('cancel-settings-btn'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  cfgJevApiKey: document.getElementById('cfg-jev-api-key'),
  cfgLayaMode: document.getElementById('cfg-laya-mode'),
  cfgLayaUrl: document.getElementById('cfg-laya-url'),
  testConnectionBtn: document.getElementById('test-connection-btn'),

  fixturesModal: document.getElementById('fixtures-modal'),
  openFixturesBtn: document.getElementById('open-fixtures-btn'),
  closeFixturesModalBtn: document.getElementById('close-fixtures-modal-btn'),
  closeFixturesBottomBtn: document.getElementById('close-fixtures-bottom-btn'),
  fixturesList: document.getElementById('fixtures-list'),
  fixturePreviewContent: document.getElementById('fixture-preview-content'),
  loadFixtureIntoStateBtn: document.getElementById('load-fixture-into-state-btn'),

  historyModal: document.getElementById('history-modal'),
  openHistoryBtn: document.getElementById('open-history-btn'),
  closeHistoryModalBtn: document.getElementById('close-history-modal-btn'),
  closeHistoryBottomBtn: document.getElementById('close-history-bottom-btn'),
  historyTableContainer: document.getElementById('history-table-container'),
  exportJsonBtn: document.getElementById('export-json-btn'),
  exportCsvBtn: document.getElementById('export-csv-btn'),
  exportMdBtn: document.getElementById('export-md-btn'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),

  toastNotice: document.getElementById('toast-notice'),
  toastText: document.getElementById('toast-text'),
  toastIcon: document.getElementById('toast-icon')
};

// Toast notification helper
function showToast(message, icon = 'ℹ️', duration = 3000) {
  elements.toastText.textContent = message;
  elements.toastIcon.textContent = icon;
  elements.toastNotice.style.display = 'flex';
  setTimeout(() => {
    elements.toastNotice.style.display = 'none';
  }, duration);
}

// Initial Setup & Health Check
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();

    // Update Laya status
    if (data.laya?.ready) {
      elements.layaStatusDot.className = 'status-dot online';
      elements.layaStatusText.textContent = `${data.laya.device?.toUpperCase() || 'MPS'} ${t('statusOnline')}`;
      elements.layaDeviceBadge.textContent = data.laya.device?.toUpperCase() || 'MPS';
    } else {
      elements.layaStatusDot.className = 'status-dot offline';
      elements.layaStatusText.textContent = t('statusOffline');
    }

    // Update Jev status
    const clientKey = localStorage.getItem('laya_bench_jev_key');
    if (data.jev?.hasKey || clientKey) {
      elements.jevStatusDot.className = 'status-dot online';
      elements.jevStatusText.textContent = `${t('statusReady')}`;
    } else {
      elements.jevStatusDot.className = 'status-dot offline';
      elements.jevStatusText.textContent = 'API Key Needed';
    }
  } catch (err) {
    console.error('Health check failed:', err);
    elements.layaStatusDot.className = 'status-dot offline';
    elements.layaStatusText.textContent = 'Server Offline';
  }
}

// Render Sidebar Level List
function renderSidebarLevels() {
  const lang = getLang();
  elements.sidebarLevelsList.innerHTML = '';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'sidebar-header';
  headerDiv.innerHTML = `
    <span class="sidebar-title">${t('levels')}</span>
    <span class="badge" style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">10 / 30</span>
  `;
  elements.sidebarLevelsList.appendChild(headerDiv);

  BENCHMARK_LEVELS.forEach((lvl, idx) => {
    const card = document.createElement('div');
    card.className = `level-card ${idx === currentLevelIdx ? 'active' : ''}`;
    card.addEventListener('click', () => selectLevel(idx));

    card.innerHTML = `
      <div class="level-badge">${lvl.level}</div>
      <div class="level-info">
        <div class="level-name">${lvl.title[lang] || lvl.title.en}</div>
        <div class="level-concept">${lvl.idea[lang] || lvl.idea.en}</div>
      </div>
    `;
    elements.sidebarLevelsList.appendChild(card);
  });
}

// Compute Schema Badge for Active Scenario
function getScenarioSchemaBadge(lvl, opt) {
  if (lvl.level === 9 || opt.fixturePaths) {
    const count = (opt.fixturePaths || []).length;
    return count > 0 ? `BATCH (${count} FILES)` : 'BATCH';
  }
  const qTypes = Object.values(opt.questions || {}).map(q => q.type?.toUpperCase()).filter(Boolean);
  const uniqueTypes = [...new Set(qTypes)];
  if (opt.fixturePath) {
    return uniqueTypes.length > 0 ? `FILE + ${uniqueTypes.join(' / ')}` : 'FILE FIXTURE';
  }
  return uniqueTypes.length > 0 ? uniqueTypes.join(' / ') : 'SYSTEM ONE';
}

// Render Level Banner & Scenario Tabs
function renderActiveLevel() {
  const lang = getLang();
  const lvl = BENCHMARK_LEVELS[currentLevelIdx];
  if (!lvl) return;

  const opt = lvl.options[currentOptionIdx] || lvl.options[0];

  elements.bannerLevelTitle.textContent = lvl.title[lang] || lvl.title.en;
  elements.bannerConceptText.textContent = lvl.idea[lang] || lvl.idea.en;
  elements.bannerLevelDesc.textContent = lvl.description[lang] || lvl.description.en;

  // Render Scenario Tabs
  elements.scenarioTabsContainer.innerHTML = '';
  lvl.options.forEach((o, optIdx) => {
    const tab = document.createElement('button');
    tab.className = `scenario-tab ${optIdx === currentOptionIdx ? 'active' : ''}`;
    tab.textContent = o.title[lang] || o.title.en;
    tab.title = o.description[lang] || o.description.en;
    tab.setAttribute('aria-label', `${o.title[lang] || o.title.en}: ${o.description[lang] || o.description.en}`);
    tab.addEventListener('click', () => selectScenario(optIdx));
    elements.scenarioTabsContainer.appendChild(tab);
  });

  // Render Active Scenario Option Description
  if (opt) {
    if (elements.scenarioDescBadge) {
      elements.scenarioDescBadge.textContent = `🎯 ${opt.id}`;
    }
    if (elements.scenarioSchemaBadge) {
      elements.scenarioSchemaBadge.textContent = getScenarioSchemaBadge(lvl, opt);
    }
    if (elements.scenarioDescTitle) {
      elements.scenarioDescTitle.textContent = opt.title[lang] || opt.title.en;
    }
    if (elements.scenarioDescText) {
      elements.scenarioDescText.textContent = opt.description[lang] || opt.description.en;
    }
    if (elements.playgroundScenarioLabel) {
      elements.playgroundScenarioLabel.textContent = `${t('scenarioGoal')}:`;
    }
    if (elements.playgroundScenarioDesc) {
      elements.playgroundScenarioDesc.textContent = opt.description[lang] || opt.description.en;
    }
  }

  loadScenarioPreset();
}

// Load Preset JSON into Playground Inputs
async function loadScenarioPreset() {
  const lvl = BENCHMARK_LEVELS[currentLevelIdx];
  const opt = lvl.options[currentOptionIdx];
  if (!opt) return;

  const isBatch = (lvl.level === 9) || Boolean(opt.fixturePaths);

  if (isBatch) {
    if (elements.singlePlaygroundSection) elements.singlePlaygroundSection.style.display = 'none';
    if (elements.batchPlaygroundSection) elements.batchPlaygroundSection.style.display = 'block';
    if (elements.singleResultsContainer) elements.singleResultsContainer.style.display = 'none';
    if (elements.batchResultsContainer) elements.batchResultsContainer.style.display = 'block';

    elements.btnTextCompare.textContent = t('runBatchCompare');
    elements.batchQuestionsJson.value = JSON.stringify(opt.questions || {}, null, 2);

    const paths = opt.fixturePaths || [];
    elements.batchFilesCountBadge.textContent = `${paths.length} ${paths.length === 1 ? 'File' : 'Files'}`;
    elements.batchFilesContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem;">Loading ${paths.length} fixture files...</div>`;

    currentBatchFiles = [];
    for (const p of paths) {
      try {
        const res = await fetch(`/api/fixtures/read?path=${encodeURIComponent(p)}`);
        const data = await res.json();
        currentBatchFiles.push({
          path: p,
          name: p.split('/').pop(),
          content: data.content || '',
          size: data.content ? data.content.length : 0
        });
      } catch (err) {
        currentBatchFiles.push({ path: p, name: p.split('/').pop(), content: '', size: 0 });
      }
    }

    renderBatchFilesList();
  } else {
    if (elements.singlePlaygroundSection) elements.singlePlaygroundSection.style.display = 'block';
    if (elements.batchPlaygroundSection) elements.batchPlaygroundSection.style.display = 'none';
    if (elements.singleResultsContainer) elements.singleResultsContainer.style.display = 'block';
    if (elements.batchResultsContainer) elements.batchResultsContainer.style.display = 'none';

    elements.btnTextCompare.textContent = t('runCompare');

    // Automatically load fixture file if defined (Levels 8, 10)
    if (opt.fixturePath) {
      try {
        const res = await fetch(`/api/fixtures/read?path=${encodeURIComponent(opt.fixturePath)}`);
        const data = await res.json();
        const base = opt.state || opt.extraState || {};
        const stateWithFile = {
          ...base,
          fixture_path: opt.fixturePath,
          file_content: data.content || ''
        };
        elements.inputStateJson.value = JSON.stringify(stateWithFile, null, 2);
      } catch (err) {
        elements.inputStateJson.value = JSON.stringify(opt.state || opt.extraState || {}, null, 2);
      }
    } else {
      elements.inputStateJson.value = JSON.stringify(opt.state || {}, null, 2);
    }

    elements.inputQuestionsJson.value = JSON.stringify(opt.questions || {}, null, 2);
  }
}

function renderBatchFilesList() {
  elements.batchFilesContainer.innerHTML = '';
  currentBatchFiles.forEach((file, idx) => {
    const card = document.createElement('div');
    card.className = 'batch-file-card';

    const ext = file.name.split('.').pop();
    const extColor = ext === 'py' ? '#38bdf8' : (ext === 'js' ? '#f59e0b' : '#a855f7');

    card.innerHTML = `
      <div class="batch-file-header">
        <div class="batch-file-title">
          <span>📄</span>
          <span>${file.path}</span>
        </div>
        <div class="batch-file-meta">
          <span class="badge" style="background: rgba(255,255,255,0.06); color: ${extColor}; font-size: 0.68rem; font-family: var(--font-mono);">${ext.toUpperCase()}</span>
          <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${file.size} B</span>
          <button class="btn btn-ghost toggle-code-btn" data-idx="${idx}" style="font-size: 0.7rem; padding: 2px 6px;">
            ${t('viewCode')}
          </button>
        </div>
      </div>
      <pre class="batch-file-code" id="batch-code-${idx}" style="display: none;"><code>${escapeHtml(file.content)}</code></pre>
    `;

    const toggleBtn = card.querySelector('.toggle-code-btn');
    const codeEl = card.querySelector(`#batch-code-${idx}`);
    toggleBtn.addEventListener('click', () => {
      const isVisible = codeEl.style.display !== 'none';
      codeEl.style.display = isVisible ? 'none' : 'block';
      toggleBtn.textContent = isVisible ? t('viewCode') : t('hideCode');
    });

    elements.batchFilesContainer.appendChild(card);
  });
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Select Level
function selectLevel(idx) {
  currentLevelIdx = idx;
  currentOptionIdx = 0;
  renderSidebarLevels();
  renderActiveLevel();
}

// Select Scenario
function selectScenario(optIdx) {
  currentOptionIdx = optIdx;
  renderActiveLevel();
}

// Get Current Headers for Jev & Laya
function getApiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const clientKey = localStorage.getItem('laya_bench_jev_key');
  if (clientKey) {
    headers['X-Jev-Key'] = clientKey;
  }
  const layaMode = localStorage.getItem('laya_bench_mode') || 'worker';
  headers['X-Laya-Mode'] = layaMode;
  return headers;
}

// Execute Benchmark Comparison
async function runCompare() {
  const lvl = BENCHMARK_LEVELS[currentLevelIdx];
  const opt = lvl.options[currentOptionIdx];
  if (lvl.level === 9 || opt?.fixturePaths) {
    return runBatchCompare('compare');
  }

  let state = {};
  let questions = {};

  try {
    state = JSON.parse(elements.inputStateJson.value);
  } catch (e) {
    showToast('Invalid JSON in State input', '⚠️');
    return;
  }

  try {
    questions = JSON.parse(elements.inputQuestionsJson.value);
  } catch (e) {
    showToast('Invalid JSON in Questions input', '⚠️');
    return;
  }

  elements.runCompareBtn.disabled = true;
  elements.runCompareBtn.innerHTML = `⏳ <span>${t('statusRunning')}</span>`;
  elements.telemetryTimestamp.textContent = new Date().toLocaleTimeString();

  const payload = { state, questions, model: 'auto' };

  try {
    const res = await fetch('/api/bench/compare', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    lastComparisonResult = data;

    renderComparisonResults(data);
    saveToHistory(data);

    if (data.jev?.error) {
      if (data.jev.error.includes('API Key') || data.jev.error.includes('authentication_error')) {
        showToast('Jev API key needed: Click Settings (⚙️) to enter your TypeSafe key.', '⚠️', 6000);
      } else {
        showToast(`Jev response error: ${data.jev.error}`, '⚠️', 6000);
      }
    } else {
      showToast('Benchmark run completed!', '✅');
    }
  } catch (err) {
    console.error('Benchmark execution failed:', err);
    showToast(`Execution error: ${err.message}`, '❌');
  } finally {
    elements.runCompareBtn.disabled = false;
    elements.runCompareBtn.innerHTML = `🚀 <span>${t('runCompare')}</span>`;
  }
}

// Execute Laya Only
async function runLayaOnly() {
  const lvl = BENCHMARK_LEVELS[currentLevelIdx];
  const opt = lvl.options[currentOptionIdx];
  if (lvl.level === 9 || opt?.fixturePaths) {
    return runBatchCompare('laya');
  }

  let state, questions;
  try {
    state = JSON.parse(elements.inputStateJson.value);
    questions = JSON.parse(elements.inputQuestionsJson.value);
  } catch (e) {
    return showToast('Invalid JSON inputs', '⚠️');
  }

  elements.runLayaBtn.disabled = true;
  elements.runLayaBtn.innerHTML = `⏳ <span>...</span>`;

  try {
    const res = await fetch('/api/bench/laya', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ state, questions, model: 'auto' })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Update Laya metrics
    elements.layaLatencyVal.textContent = data.latency_ms;
    elements.layaModelVal.textContent = data.model || 'laya-rl';
    elements.layaTokensVal.textContent = `${data.usage?.input_tokens || 0} in / ${data.usage?.output_tokens || 0} out`;
    elements.layaDeviceBadge.textContent = (data.device || 'mps').toUpperCase();
    elements.rawJsonLaya.textContent = JSON.stringify(data, null, 2);

    renderDecisionsList(data.answers || {}, null);
    showToast('Laya inference completed in ' + data.latency_ms + 'ms', '⚡');
  } catch (err) {
    showToast(`Laya Error: ${err.message}`, '❌');
  } finally {
    elements.runLayaBtn.disabled = false;
    elements.runLayaBtn.innerHTML = `⚡ <span>${t('runLayaOnly')}</span>`;
  }
}

// Execute Jev Only
async function runJevOnly() {
  const lvl = BENCHMARK_LEVELS[currentLevelIdx];
  const opt = lvl.options[currentOptionIdx];
  if (lvl.level === 9 || opt?.fixturePaths) {
    return runBatchCompare('jev');
  }

  let state, questions;
  try {
    state = JSON.parse(elements.inputStateJson.value);
    questions = JSON.parse(elements.inputQuestionsJson.value);
  } catch (e) {
    return showToast('Invalid JSON inputs', '⚠️');
  }

  elements.runJevBtn.disabled = true;
  elements.runJevBtn.innerHTML = `⏳ <span>...</span>`;

  try {
    const res = await fetch('/api/bench/jev', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ state, questions, model: 'jev-latest' })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    elements.jevLatencyVal.textContent = data.latency_ms;
    elements.jevTtfbVal.textContent = data.ttfb_ms || data.latency_ms;
    elements.jevTokensVal.textContent = `${data.usage?.input_tokens || 0} in / ${data.usage?.output_tokens || 0} out`;
    elements.rawJsonJev.textContent = JSON.stringify(data, null, 2);

    renderDecisionsList(null, data.answers || {});
    showToast('Jev cloud completed in ' + data.latency_ms + 'ms', '☁️');
  } catch (err) {
    showToast(`Jev Error: ${err.message}`, '❌');
  } finally {
    elements.runJevBtn.disabled = false;
    elements.runJevBtn.innerHTML = `☁️ <span>${t('runJevOnly')}</span>`;
  }
}

// Execute Batch Comparison (Level 9)
async function runBatchCompare(target = 'compare') {
  let questions = {};
  try {
    questions = JSON.parse(elements.batchQuestionsJson.value);
  } catch (e) {
    return showToast('Invalid JSON in Batch Questions schema', '⚠️');
  }

  if (currentBatchFiles.length === 0) {
    return showToast('No files loaded in batch', '⚠️');
  }

  elements.runCompareBtn.disabled = true;
  elements.runLayaBtn.disabled = true;
  elements.runJevBtn.disabled = true;
  elements.runCompareBtn.innerHTML = `⏳ <span>${t('statusRunning')}</span>`;
  elements.telemetryTimestamp.textContent = new Date().toLocaleTimeString();

  const payload = {
    target,
    files: currentBatchFiles.map(f => ({ path: f.path, content: f.content })),
    questions,
    model: 'auto'
  };

  try {
    const res = await fetch('/api/bench/batch', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    lastComparisonResult = data;
    renderBatchResults(data);
    saveToHistory(data);

    if (data.jev?.error) {
      if (data.jev.error.includes('API Key') || data.jev.error.includes('authentication_error')) {
        showToast('Jev API key needed: Click Settings (⚙️) to enter your TypeSafe key.', '⚠️', 6000);
      } else {
        showToast(`Jev response error: ${data.jev.error}`, '⚠️', 6000);
      }
    } else {
      showToast(`Batch completed: ${data.totalFiles} files evaluated!`, '⚡');
    }
  } catch (err) {
    console.error('Batch compare failed:', err);
    showToast(`Batch execution error: ${err.message}`, '❌');
  } finally {
    elements.runCompareBtn.disabled = false;
    elements.runLayaBtn.disabled = false;
    elements.runJevBtn.disabled = false;
    elements.runCompareBtn.innerHTML = `🚀 <span>${t('runBatchCompare')}</span>`;
    elements.runLayaBtn.innerHTML = `⚡ <span>${t('runLayaOnly')}</span>`;
    elements.runJevBtn.innerHTML = `☁️ <span>${t('runJevOnly')}</span>`;
  }
}

// Render Batch Results Matrix (Level 9)
function renderBatchResults(data) {
  const { files = [], laya, jev, comparison, totalFiles } = data;

  // 1. Stats Summary
  elements.batchLayaTime.textContent = laya?.totalLatencyMs ? `${laya.totalLatencyMs} ms` : '--';
  elements.batchJevTime.textContent = jev?.totalLatencyMs ? `${jev.totalLatencyMs} ms` : (jev?.error ? 'Error' : '--');
  elements.batchSpeedupVal.textContent = comparison?.speedupRatio ? `${comparison.speedupRatio}x Faster` : '--';
  elements.batchThroughputVal.textContent = comparison?.throughputLaya ? `${comparison.throughputLaya} f/s` : '--';

  // 2. Decision Matrix List
  elements.batchMatrixList.innerHTML = '';

  files.forEach(f => {
    const item = document.createElement('div');
    const ansStr = JSON.stringify(f.laya?.answers || {}) + JSON.stringify(f.jev?.answers || {});
    const isVulnerable = ansStr.includes('potential_ssrf') ||
      ansStr.includes('hardcoded_secrets') ||
      ansStr.includes('high_priority');

    item.className = `batch-matrix-item ${isVulnerable ? 'has-hazard' : ''}`;

    let hazardBadge = '';
    if (isVulnerable) {
      hazardBadge = `<span class="badge-hazard">⚠️ ${t('hazardDetected')}</span>`;
    }

    const agreeBadge = f.agreed
      ? `<span class="agreement-badge matched" style="font-size: 0.68rem; padding: 2px 6px;">✓ ${t('matched')}</span>`
      : `<span class="agreement-badge divergent" style="font-size: 0.68rem; padding: 2px 6px;">✕ ${t('divergent')}</span>`;

    item.innerHTML = `
      <div class="batch-matrix-header">
        <div class="batch-matrix-filename">
          <span>📄</span>
          <span>${f.path}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono); font-weight: 400;">(${f.sizeBytes} B)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${hazardBadge}
          ${agreeBadge}
        </div>
      </div>
      <div class="decision-compare-row">
        <!-- Laya Result -->
        <div class="decision-col laya">
          <div style="color: var(--laya-cyan); font-weight: 700; margin-bottom: 0.2rem; font-size: 0.75rem;">LAYA (GPU)</div>
          ${formatAnswerBody(f.laya?.answers ? Object.values(f.laya.answers)[0] : null)}
        </div>
        <!-- Jev Result -->
        <div class="decision-col jev">
          <div style="color: var(--jev-magenta); font-weight: 700; margin-bottom: 0.2rem; font-size: 0.75rem;">JEV (Cloud)</div>
          ${f.jev?.error ? `<div style="color: var(--accent-rose); font-size: 0.75rem;">${f.jev.error}</div>` : formatAnswerBody(f.jev?.answers ? Object.values(f.jev.answers)[0] : null)}
        </div>
      </div>
    `;

    elements.batchMatrixList.appendChild(item);
  });

  // Update raw diff inspector
  elements.rawJsonLaya.textContent = JSON.stringify(laya || {}, null, 2);
  elements.rawJsonJev.textContent = JSON.stringify(jev || {}, null, 2);
}

// Render Telemetry Comparison UI
function renderComparisonResults(data) {
  const { laya, jev, comparison } = data;

  // Laya column
  if (laya && !laya.error) {
    elements.layaLatencyVal.textContent = laya.latency_ms;
    elements.layaModelVal.textContent = laya.model || 'laya-rl';
    elements.layaTokensVal.textContent = `${laya.usage?.input_tokens || 0} in / ${laya.usage?.output_tokens || 0} out`;
    elements.layaDeviceBadge.textContent = (laya.device || 'mps').toUpperCase();
    elements.rawJsonLaya.textContent = JSON.stringify(laya, null, 2);
  } else {
    elements.layaLatencyVal.textContent = 'ERR';
    elements.rawJsonLaya.textContent = JSON.stringify(laya || { error: 'Failed' }, null, 2);
  }

  // Jev column
  if (jev && !jev.error) {
    elements.jevLatencyVal.textContent = jev.latency_ms;
    elements.jevTtfbVal.textContent = `${jev.ttfb_ms || jev.latency_ms}ms`;
    elements.jevTokensVal.textContent = `${jev.usage?.input_tokens || 0} in / ${jev.usage?.output_tokens || 0} out`;
    elements.rawJsonJev.textContent = JSON.stringify(jev, null, 2);
  } else {
    elements.jevLatencyVal.textContent = 'ERR';
    elements.jevTtfbVal.textContent = 'Failed';
    elements.jevTokensVal.textContent = 'Check API Key (⚙️)';
    elements.rawJsonJev.textContent = JSON.stringify(jev || { error: 'Failed to reach Jev endpoint' }, null, 2);
  }

  // Winner & Speedup Card
  if (comparison) {
    elements.winnerCard.style.display = 'flex';
    const isLayaWinner = comparison.winner === 'laya';
    elements.winnerStatement.textContent = isLayaWinner
      ? `Laya is ${comparison.latencySpeedupRatio}x faster than Jev`
      : `Jev responded in ${comparison.jevLatencyMs}ms`;
    elements.speedupBadge.textContent = `${Math.abs(comparison.latencyDeltaMs)}ms ${isLayaWinner ? 'Saved' : 'Difference'}`;

    // Latency Bar Chart
    elements.latencyBarContainer.style.display = 'flex';
    const maxLat = Math.max(comparison.layaLatencyMs, comparison.jevLatencyMs, 100);
    const layaPct = Math.max(6, Math.round((comparison.layaLatencyMs / maxLat) * 100));
    const jevPct = Math.max(6, Math.round((comparison.jevLatencyMs / maxLat) * 100));

    elements.barFillLaya.style.width = `${layaPct}%`;
    elements.barFillJev.style.width = `${jevPct}%`;
    elements.barMsLaya.textContent = `${comparison.layaLatencyMs}ms`;
    elements.barMsJev.textContent = `${comparison.jevLatencyMs}ms`;

    renderDecisionsList(laya.answers || {}, jev.answers || {}, comparison.questionDiffs);
  } else {
    elements.winnerCard.style.display = 'none';
    elements.latencyBarContainer.style.display = 'none';
    renderDecisionsList(laya?.answers, jev?.answers);
  }
}

// Render Structured Decision Answers
function renderDecisionsList(layaAnswers, jevAnswers, diffs = {}) {
  elements.decisionsList.innerHTML = '';
  const allKeys = new Set([
    ...Object.keys(layaAnswers || {}),
    ...Object.keys(jevAnswers || {})
  ]);

  if (allKeys.size === 0) {
    elements.decisionsList.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem; text-align: center;">
        No decision answers returned.
      </div>
    `;
    return;
  }

  allKeys.forEach(qKey => {
    const lAns = layaAnswers ? layaAnswers[qKey] : null;
    const jAns = jevAnswers ? jevAnswers[qKey] : null;
    const diff = diffs[qKey];

    const card = document.createElement('div');
    card.className = 'decision-item';

    // Status badge (Match / Divergent / Single)
    let badgeHtml = '';
    if (diff) {
      badgeHtml = diff.verdictAgree
        ? `<span class="agreement-badge matched">✓ ${t('matched')}</span>`
        : `<span class="agreement-badge divergent">✕ ${t('divergent')}</span>`;
    }

    card.innerHTML = `
      <div class="decision-header">
        <span style="font-family: var(--font-mono); color: #fff;">${qKey}</span>
        ${badgeHtml}
      </div>
      <div class="decision-compare-row">
        <!-- Laya Answer -->
        <div class="decision-col laya">
          <div style="color: var(--laya-cyan); font-weight: 700; margin-bottom: 0.2rem;">LAYA</div>
          ${formatAnswerBody(lAns)}
        </div>
        <!-- Jev Answer -->
        <div class="decision-col jev">
          <div style="color: var(--jev-magenta); font-weight: 700; margin-bottom: 0.2rem;">JEV</div>
          ${formatAnswerBody(jAns)}
        </div>
      </div>
    `;
    elements.decisionsList.appendChild(card);
  });
}

function formatAnswerBody(ans) {
  if (!ans) return '<div style="color: var(--text-muted);">No answer</div>';

  if (ans.type === 'noul') {
    const val = Number((ans.noul ?? 0).toFixed(3));
    const conf = ans.confidence !== undefined ? ` (conf: ${Number(ans.confidence).toFixed(2)})` : '';
    return `
      <div><strong>P(true):</strong> ${val}${conf}</div>
      <div style="font-size: 0.72rem; color: ${val >= 0.5 ? 'var(--accent-emerald)' : 'var(--text-muted)'};">
        Verdict: ${val >= 0.5 ? 'TRUE / YES' : 'FALSE / NO'}
      </div>
    `;
  }

  if (ans.type === 'choice') {
    const conf = ans.confidence !== undefined ? ` [conf: ${Number(ans.confidence).toFixed(2)}]` : '';
    let probsHtml = '';
    if (ans.probabilities) {
      probsHtml = Object.entries(ans.probabilities)
        .map(([k, p]) => `<div class="prob-item"><span>${k}</span><span>${(p * 100).toFixed(0)}%</span></div>`)
        .join('');
    }
    return `
      <div><strong>Choice:</strong> <span style="color: #fff;">${ans.choice}</span>${conf}</div>
      ${probsHtml ? `<div style="margin-top: 0.3rem;">${probsHtml}</div>` : ''}
    `;
  }

  if (ans.type === 'score') {
    const scoreVal = Number((ans.score ?? 0).toFixed(2));
    const conf = ans.confidence !== undefined ? ` [conf: ${Number(ans.confidence).toFixed(2)}]` : '';
    return `
      <div><strong>Score:</strong> <span style="color: #fff;">${scoreVal}</span>${conf}</div>
      ${ans.legend ? `<div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">Levels: ${Object.values(ans.legend).join(' → ')}</div>` : ''}
    `;
  }

  return `<pre style="font-size: 0.7rem;">${JSON.stringify(ans, null, 1)}</pre>`;
}

// Automated Batch Suite Runner
async function runBatchSuite(targetLevelIdx = null) {
  if (isBatchRunning) return;
  isBatchRunning = true;

  const scenariosToRun = [];
  if (targetLevelIdx !== null) {
    const lvl = BENCHMARK_LEVELS[targetLevelIdx];
    lvl.options.forEach((opt, oIdx) => {
      scenariosToRun.push({ lvlIdx: targetLevelIdx, optIdx: oIdx, lvl, opt });
    });
  } else {
    BENCHMARK_LEVELS.forEach((lvl, lIdx) => {
      lvl.options.forEach((opt, oIdx) => {
        scenariosToRun.push({ lvlIdx: lIdx, optIdx: oIdx, lvl, opt });
      });
    });
  }

  elements.batchProgressTrack.style.display = 'block';
  elements.batchProgressBar.style.width = '0%';
  elements.batchStatusTitle.textContent = t('runningBatch');
  showToast(`Starting batch runner for ${scenariosToRun.length} scenarios...`, '🧪');

  let completed = 0;
  for (const item of scenariosToRun) {
    currentLevelIdx = item.lvlIdx;
    currentOptionIdx = item.optIdx;
    renderSidebarLevels();
    renderActiveLevel();

    try {
      if (item.lvl.level === 9 || item.opt.fixturePaths) {
        const res = await fetch('/api/bench/batch', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            files: item.opt.fixturePaths,
            questions: item.opt.questions || {},
            model: 'auto'
          })
        });
        const data = await res.json();
        lastComparisonResult = data;
        renderBatchResults(data);
        saveToHistory(data);
      } else {
        let stateObj = item.opt.state || item.opt.extraState || {};
        if (item.opt.fixturePath) {
          try {
            const fRes = await fetch(`/api/fixtures/read?path=${encodeURIComponent(item.opt.fixturePath)}`);
            const fData = await fRes.json();
            stateObj = { ...stateObj, fixture_path: item.opt.fixturePath, file_content: fData.content || '' };
          } catch (e) { }
        }
        const payload = {
          state: stateObj,
          questions: item.opt.questions || {},
          model: 'auto'
        };
        const res = await fetch('/api/bench/compare', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        lastComparisonResult = data;
        renderComparisonResults(data);
        saveToHistory(data);
      }
    } catch (e) {
      console.warn('Batch step failed for', item.opt.key, e);
    }

    completed++;
    const pct = Math.round((completed / scenariosToRun.length) * 100);
    elements.batchProgressBar.style.width = `${pct}%`;
    elements.batchStatusSub.textContent = `Completed ${completed} of ${scenariosToRun.length} scenarios (${pct}%)`;
  }

  isBatchRunning = false;
  elements.batchStatusTitle.textContent = t('batchCompleted');
  showToast(`Batch completed: ${scenariosToRun.length} scenarios evaluated!`, '🎉', 4000);
}

// History Management
function saveToHistory(res) {
  const lvl = BENCHMARK_LEVELS[currentLevelIdx];
  const opt = lvl.options[currentOptionIdx];
  const lang = getLang();

  const record = {
    id: `run_${Date.now()}`,
    timestamp: new Date().toISOString(),
    levelNum: lvl.level,
    levelTitle: lvl.title[lang] || lvl.title.en,
    scenarioTitle: opt.title[lang] || opt.title.en,
    scenarioKey: opt.key,
    scenarioDesc: opt.description[lang] || opt.description.en,
    layaLatency: res.laya?.totalLatencyMs || res.laya?.latency_ms || null,
    jevLatency: res.jev?.totalLatencyMs || res.jev?.latency_ms || null,
    speedup: res.comparison?.speedupRatio || res.comparison?.latencySpeedupRatio || null,
    winner: res.comparison?.winner || null,
    agreementRate: res.comparison?.agreementRate ?? null
  };

  benchmarkHistory.unshift(record);
  if (benchmarkHistory.length > 50) benchmarkHistory.pop();
  localStorage.setItem('laya_bench_history', JSON.stringify(benchmarkHistory));
}

function renderHistoryTable() {
  const lang = getLang();
  if (benchmarkHistory.length === 0) {
    elements.historyTableContainer.innerHTML = `
      <div style="color: var(--text-muted); padding: 2rem; text-align: center;">
        ${t('noHistory')}
      </div>
    `;
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.78rem;">
      <thead>
        <tr style="border-bottom: 1px solid var(--border-medium); text-align: left; color: var(--text-muted);">
          <th style="padding: 0.5rem;">Time</th>
          <th style="padding: 0.5rem;">Level / Scenario</th>
          <th style="padding: 0.5rem; color: var(--laya-cyan);">Laya</th>
          <th style="padding: 0.5rem; color: var(--jev-magenta);">Jev</th>
          <th style="padding: 0.5rem;">Speedup</th>
          <th style="padding: 0.5rem;">Agreement</th>
        </tr>
      </thead>
      <tbody>
  `;

  benchmarkHistory.forEach(item => {
    const timeStr = new Date(item.timestamp).toLocaleTimeString();
    html += `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 0.5rem; color: var(--text-secondary);">${timeStr}</td>
        <td style="padding: 0.5rem;" title="${(item.scenarioDesc || '').replace(/"/g, '&quot;')}">
          <div style="font-weight: 600; color: #fff;">L${item.levelNum}: ${item.scenarioTitle}</div>
          ${item.scenarioDesc ? `<div style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-sans); margin-top: 2px;">${item.scenarioDesc}</div>` : ''}
        </td>
        <td style="padding: 0.5rem; font-weight: 700; color: var(--laya-cyan);">${item.layaLatency ?? '--'}ms</td>
        <td style="padding: 0.5rem; font-weight: 700; color: var(--jev-magenta);">${item.jevLatency ?? '--'}ms</td>
        <td style="padding: 0.5rem; color: #fff;">${item.speedup ? `${item.speedup}x` : '--'}</td>
        <td style="padding: 0.5rem;">${item.agreementRate !== null ? `${item.agreementRate}%` : '--'}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  elements.historyTableContainer.innerHTML = html;
}

// Export Handlers
function exportHistory(format) {
  if (benchmarkHistory.length === 0) {
    return showToast('History is empty', '⚠️');
  }

  let content = '';
  let filename = `laya_vs_jev_benchmark_${Date.now()}`;
  let mimeType = 'text/plain';

  if (format === 'json') {
    content = JSON.stringify(benchmarkHistory, null, 2);
    filename += '.json';
    mimeType = 'application/json';
  } else if (format === 'csv') {
    const headers = ['Timestamp', 'Level', 'Scenario', 'Description', 'LayaLatencyMs', 'JevLatencyMs', 'SpeedupRatio', 'AgreementRate'];
    const rows = benchmarkHistory.map(h => [
      h.timestamp, h.levelNum, `"${h.scenarioTitle}"`, `"${(h.scenarioDesc || '').replace(/"/g, '""')}"`, h.layaLatency, h.jevLatency, h.speedup, h.agreementRate
    ]);
    content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    filename += '.csv';
    mimeType = 'text/csv';
  } else if (format === 'markdown') {
    content = `# Laya vs Jev Benchmark Report\n\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n\n`;
    content += `| Time | Level | Scenario | Description | Laya (ms) | Jev (ms) | Speedup | Agreement |\n`;
    content += `|---|---|---|---|---|---|---|---|\n`;
    benchmarkHistory.forEach(h => {
      content += `| ${new Date(h.timestamp).toLocaleTimeString()} | L${h.levelNum} | ${h.scenarioTitle} | ${h.scenarioDesc || ''} | ${h.layaLatency}ms | ${h.jevLatency}ms | ${h.speedup}x | ${h.agreementRate}% |\n`;
    });
    filename += '.md';
    mimeType = 'text/markdown';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${format.toUpperCase()}`, '📥');
}

// Fixtures Viewer
async function loadFixturesList() {
  try {
    const res = await fetch('/api/fixtures');
    const data = await res.json();
    currentFixtures = data.files || [];
    renderFixturesModal();
  } catch (err) {
    console.error('Failed to load fixtures:', err);
  }
}

function renderFixturesModal() {
  elements.fixturesList.innerHTML = '';
  currentFixtures.forEach(f => {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);
      background: var(--bg-card); cursor: pointer; border: 1px solid var(--border-subtle);
    `;
    item.innerHTML = `
      <span style="font-family: var(--font-mono); font-size: 0.82rem; color: #fff;">📄 ${f.path}</span>
      <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${f.size} B</span>
    `;
    item.addEventListener('click', () => previewFixture(f.path));
    elements.fixturesList.appendChild(item);
  });
}

async function previewFixture(relPath) {
  selectedFixturePath = relPath;
  try {
    const res = await fetch(`/api/fixtures/read?path=${encodeURIComponent(relPath)}`);
    const data = await res.json();
    elements.fixturePreviewContent.textContent = data.content || '// Empty file';
  } catch (err) {
    elements.fixturePreviewContent.textContent = `// Error loading file: ${err.message}`;
  }
}

// Update All UI Text on Language Switch
function updateLanguageUI() {
  const lang = getLang();
  elements.langLabel.textContent = lang === 'en' ? 'EN / РУС' : 'РУС / EN';
  elements.appTitle.textContent = t('appTitle');
  elements.appSubtitle.textContent = t('appSubtitle');

  elements.sidebarLevelsTitle.textContent = t('levels');
  elements.btnTextRunLaya.textContent = t('runLayaOnly');
  elements.btnTextRunJev.textContent = t('runJevOnly');
  elements.btnTextCompare.textContent = t('runCompare');
  elements.btnTextRunLevelSuite.textContent = t('runLevelSuite');
  elements.btnTextRunAllSuite.textContent = t('runAllSuite');
  elements.btnTextFixtures.textContent = t('fixtures');
  elements.btnTextHistory.textContent = t('history');
  elements.btnTextSettings.textContent = t('settings');
  elements.btnTextResetPreset.textContent = t('resetPreset');

  elements.labelPlaygroundTitle.textContent = t('stateInput');
  elements.labelStateInput.textContent = t('stateInput');
  elements.labelQuestionsInput.textContent = t('questionsInput');
  elements.labelTelemetryTitle.textContent = t('telemetryDashboard');
  elements.labelAnswersTitle.textContent = t('chosenVerdict');
  elements.labelDiffTitle.textContent = t('rawDiff');
  elements.btnTextCopyJson.textContent = t('copyJson');

  if (elements.labelBatchFilesTitle) elements.labelBatchFilesTitle.textContent = t('batchFilesQueued');
  if (elements.labelBatchMatrixTitle) elements.labelBatchMatrixTitle.textContent = t('batchResultsMatrix');

  const lvl = BENCHMARK_LEVELS[currentLevelIdx];
  const opt = lvl?.options[currentOptionIdx];
  if (lvl?.level === 9 || opt?.fixturePaths) {
    elements.btnTextCompare.textContent = t('runBatchCompare');
  }

  renderSidebarLevels();
  renderActiveLevel();
  if (lastComparisonResult) {
    if (lastComparisonResult.mode === 'batch') {
      renderBatchResults(lastComparisonResult);
    } else {
      renderComparisonResults(lastComparisonResult);
    }
  }
}

// Event Listeners Initialization
function initEventListeners() {
  // Language Switcher
  elements.langToggleBtn.addEventListener('click', toggleLang);
  subscribeLang(updateLanguageUI);

  // Execution buttons
  elements.runCompareBtn.addEventListener('click', runCompare);
  elements.runLayaBtn.addEventListener('click', runLayaOnly);
  elements.runJevBtn.addEventListener('click', runJevOnly);
  elements.runLevelSuiteBtn.addEventListener('click', () => runBatchSuite(currentLevelIdx));
  elements.runAllSuiteBtn.addEventListener('click', () => runBatchSuite(null));
  elements.resetPresetBtn.addEventListener('click', loadScenarioPreset);

  // Copy JSON Diff
  elements.copyDiffBtn.addEventListener('click', () => {
    if (!lastComparisonResult) return;
    navigator.clipboard.writeText(JSON.stringify(lastComparisonResult, null, 2));
    showToast(t('copied'), '📋');
  });

  // Settings Modal Handlers
  elements.openSettingsBtn.addEventListener('click', () => {
    elements.cfgJevApiKey.value = localStorage.getItem('laya_bench_jev_key') || '';
    elements.cfgLayaMode.value = localStorage.getItem('laya_bench_mode') || 'worker';
    elements.cfgLayaUrl.value = localStorage.getItem('laya_bench_url') || 'http://127.0.0.1:8085/v1/systemone';
    elements.settingsModal.style.display = 'flex';
  });

  elements.jevStatusPill.style.cursor = 'pointer';
  elements.jevStatusPill.addEventListener('click', () => elements.openSettingsBtn.click());
  elements.layaStatusPill.style.cursor = 'pointer';
  elements.layaStatusPill.addEventListener('click', () => elements.openSettingsBtn.click());

  const closeSettings = () => { elements.settingsModal.style.display = 'none'; };
  elements.closeSettingsModalBtn.addEventListener('click', closeSettings);
  elements.cancelSettingsBtn.addEventListener('click', closeSettings);

  elements.saveSettingsBtn.addEventListener('click', async () => {
    const key = elements.cfgJevApiKey.value.trim();
    const mode = elements.cfgLayaMode.value;
    const url = elements.cfgLayaUrl.value.trim();

    localStorage.setItem('laya_bench_jev_key', key);
    localStorage.setItem('laya_bench_mode', mode);
    localStorage.setItem('laya_bench_url', url);

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jevApiKey: key, layaMode: mode, layaHttpUrl: url })
    });

    closeSettings();
    showToast('Settings saved!', '⚙️');
    checkHealth();
  });

  elements.testConnectionBtn.addEventListener('click', async () => {
    showToast('Testing connectivity...', '⚡');
    await checkHealth();
    showToast('Connectivity verified!', '✅');
  });

  // Fixtures Modal Handlers
  elements.openFixturesBtn.addEventListener('click', () => {
    loadFixturesList();
    elements.fixturesModal.style.display = 'flex';
  });
  const closeFixtures = () => { elements.fixturesModal.style.display = 'none'; };
  elements.closeFixturesModalBtn.addEventListener('click', closeFixtures);
  elements.closeFixturesBottomBtn.addEventListener('click', closeFixtures);

  elements.loadFixtureIntoStateBtn.addEventListener('click', () => {
    if (!selectedFixturePath) return showToast('Select a fixture first', '⚠️');
    const content = elements.fixturePreviewContent.textContent;
    try {
      let stateObj = JSON.parse(elements.inputStateJson.value || '{}');
      stateObj.fixture_path = selectedFixturePath;
      stateObj.file_content = content;
      elements.inputStateJson.value = JSON.stringify(stateObj, null, 2);
      closeFixtures();
      showToast(`Loaded ${selectedFixturePath} into State!`, '📥');
    } catch (e) {
      elements.inputStateJson.value = JSON.stringify({ fixture_path: selectedFixturePath, file_content: content }, null, 2);
      closeFixtures();
      showToast(`Loaded ${selectedFixturePath} into State!`, '📥');
    }
  });

  // History Modal Handlers
  elements.openHistoryBtn.addEventListener('click', () => {
    renderHistoryTable();
    elements.historyModal.style.display = 'flex';
  });
  const closeHistory = () => { elements.historyModal.style.display = 'none'; };
  elements.closeHistoryModalBtn.addEventListener('click', closeHistory);
  elements.closeHistoryBottomBtn.addEventListener('click', closeHistory);

  elements.clearHistoryBtn.addEventListener('click', () => {
    benchmarkHistory = [];
    localStorage.removeItem('laya_bench_history');
    renderHistoryTable();
    showToast('History cleared', '🗑️');
  });

  elements.exportJsonBtn.addEventListener('click', () => exportHistory('json'));
  elements.exportCsvBtn.addEventListener('click', () => exportHistory('csv'));
  elements.exportMdBtn.addEventListener('click', () => exportHistory('markdown'));
}

// Main Boot
window.addEventListener('DOMContentLoaded', () => {
  renderSidebarLevels();
  renderActiveLevel();
  initEventListeners();
  checkHealth();
  updateLanguageUI();
});
