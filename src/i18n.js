/**
 * Internationalization (i18n) dictionary and state for Laya vs Jev Benchmark Suite.
 * Supports Russian (ru) and English (en).
 */

export const TRANSLATIONS = {
  en: {
    appTitle: "Laya vs Jev",
    appSubtitle: "System One Benchmark Telemetry Suite",
    level: "Level",
    levels: "Levels",
    scenario: "Scenario",
    scenarios: "Scenarios",
    theOneIdea: "The One Idea",
    options: "Options",
    scenarioGoal: "Scenario Goal",
    runCompare: "Compare Laya vs Jev",
    runLayaOnly: "Run Laya Only",
    runJevOnly: "Run Jev Only",
    runAllSuite: "Run All 30 Tests",
    runLevelSuite: "Run Level Suite",
    runningBatch: "Running Batch Benchmark...",
    batchCompleted: "Batch Benchmark Completed",
    stateInput: "State (Context)",
    questionsInput: "Typed Questions (System One Schema)",
    resetPreset: "Reset to Preset",
    settings: "Settings",
    history: "History",
    fixtures: "Fixtures",
    rawDiff: "Side-by-Side Diff",
    telemetryDashboard: "Telemetry Dashboard",
    layaMetrics: "Laya (Local Engine)",
    jevMetrics: "Jev (TypeSafe Cloud)",
    latency: "Latency",
    ttfb: "TTFB",
    totalRoundtrip: "Total Roundtrip",
    speedupRatio: "Speedup",
    winnerBadge: "Winner",
    agreement: "Decision Agreement",
    confidence: "Confidence",
    tokens: "Tokens",
    inputTokens: "Input Tokens",
    outputTokens: "Output Tokens",
    device: "Device",
    statusOnline: "Online",
    statusOffline: "Offline",
    statusReady: "Ready",
    statusRunning: "Running...",
    statusError: "Error",
    localWorker: "Local Resident Worker",
    httpProxy: "HTTP Proxy (Port 8085)",
    mpsGpu: "Apple Silicon MPS (Metal)",
    cpuDevice: "CPU",
    jevCloudApi: "TypeSafe AI Cloud",
    settingsTitle: "Configuration & Connections",
    jevApiKeyLabel: "Jev API Key (TypeSafe AI)",
    jevApiKeyPlaceholder: "Enter Bearer API key or leave for .env default",
    layaModeLabel: "Laya Execution Engine",
    layaModeDesc: "Local resident worker uses .venv directly via stdio with zero HTTP overhead.",
    saveSettings: "Save Settings",
    testConnection: "Test Connection",
    historyTitle: "Benchmark Run History",
    noHistory: "No benchmark runs recorded yet. Click 'Compare' to start.",
    clearHistory: "Clear History",
    exportJson: "Export JSON",
    exportCsv: "Export CSV",
    exportMarkdown: "Export Markdown",
    fileViewerTitle: "Benchmark File Fixtures (Levels 8-10)",
    fileSelectPrompt: "Select a fixture file to inspect:",
    fileName: "File Name",
    fileSize: "Size",
    fileAction: "Load Into State",
    probabilityDistribution: "Probability Distribution",
    chosenVerdict: "Chosen Option",
    noulProbability: "P(true)",
    compositeScore: "Weighted Score",
    scoreLegend: "Score Legend",
    matched: "MATCH",
    divergent: "DIVERGENT",
    delta: "Delta",
    copyJson: "Copy JSON",
    copied: "Copied!",
    close: "Close",
    batchModeTitle: "Multi-File Batch Runner (Level 9)",
    batchFilesQueued: "Files Queued for Parallel Scan",
    runBatchCompare: "Run Multi-File Batch Scan",
    batchThroughput: "Throughput",
    filesPerSec: "files/sec",
    batchTotalLatency: "Total Batch Time",
    batchResultsMatrix: "Multi-File Decision Matrix",
    targetFile: "Target File",
    viewCode: "View Code",
    hideCode: "Hide Code",
    hazardDetected: "Security Risk Detected"
  },
  ru: {
    appTitle: "Laya против Jev",
    appSubtitle: "Телеметрия и бенчмарк System One моделей",
    level: "Уровень",
    levels: "Уровни",
    scenario: "Сценарий",
    scenarios: "Сценарии",
    theOneIdea: "Ключевая идея",
    options: "Опции",
    scenarioGoal: "Цель сценария",
    runCompare: "Сравнить Laya и Jev",
    runLayaOnly: "Запустить только Laya",
    runJevOnly: "Запустить только Jev",
    runAllSuite: "Запустить все 30 тестов",
    runLevelSuite: "Запустить уровень целиком",
    runningBatch: "Выполняется пакетный бенчмарк...",
    batchCompleted: "Пакетный бенчмарк завершён",
    stateInput: "Состояние / Контекст (State)",
    questionsInput: "Типизированные вопросы (Схема System One)",
    resetPreset: "Вернуть исходный пресет",
    settings: "Настройки",
    history: "История",
    fixtures: "Файлы-фикстуры",
    rawDiff: "Сравнение JSON (Diff)",
    telemetryDashboard: "Панель телеметрии",
    layaMetrics: "Laya (Локальный движок)",
    jevMetrics: "Jev (Облако TypeSafe)",
    latency: "Задержка (Latency)",
    ttfb: "TTFB (Первый байт)",
    totalRoundtrip: "Полное время",
    speedupRatio: "Ускорение",
    winnerBadge: "Победитель",
    agreement: "Согласованность решений",
    confidence: "Уверенность (Confidence)",
    tokens: "Токены",
    inputTokens: "Входные токены",
    outputTokens: "Выходные токены",
    device: "Устройство",
    statusOnline: "В сети",
    statusOffline: "Недоступен",
    statusReady: "Готов",
    statusRunning: "Выполняется...",
    statusError: "Ошибка",
    localWorker: "Локальный резидентный воркер",
    httpProxy: "HTTP-прокси (порт 8085)",
    mpsGpu: "Apple Silicon MPS (Metal)",
    cpuDevice: "CPU",
    jevCloudApi: "Облачный API TypeSafe AI",
    settingsTitle: "Настройки и подключения",
    jevApiKeyLabel: "API-ключ Jev (TypeSafe AI)",
    jevApiKeyPlaceholder: "Введите Bearer ключ или оставьте по умолчанию",
    layaModeLabel: "Режим выполнения Laya",
    layaModeDesc: "Локальный резидентный воркер использует .venv напрямую через stdio без сетевых задержек.",
    saveSettings: "Сохранить настройки",
    testConnection: "Проверить связь",
    historyTitle: "История запусков бенчмарков",
    noHistory: "История запусков пока пуста. Нажмите 'Сравнить' для запуска первого теста.",
    clearHistory: "Очистить историю",
    exportJson: "Экспорт в JSON",
    exportCsv: "Экспорт в CSV",
    exportMarkdown: "Экспорт в Markdown",
    fileViewerTitle: "Файлы-фикстуры бенчмарков (Уровни 8-10)",
    fileSelectPrompt: "Выберите файл для просмотра:",
    fileName: "Имя файла",
    fileSize: "Размер",
    fileAction: "Загрузить в State",
    probabilityDistribution: "Распределение вероятностей",
    chosenVerdict: "Вердикт модели",
    noulProbability: "P(истина)",
    compositeScore: "Взвешенный балл",
    scoreLegend: "Шкала оценки",
    matched: "СОВПАДЕНИЕ",
    divergent: "РАСХОЖДЕНИЕ",
    delta: "Дельта",
    copyJson: "Скопировать JSON",
    copied: "Скопировано!",
    close: "Закрыть",
    batchModeTitle: "Пакетное сканирование файлов (Уровень 9)",
    batchFilesQueued: "Файлы в очереди на параллельный анализ",
    runBatchCompare: "Запустить пакетное сканирование",
    batchThroughput: "Пропускная способность",
    filesPerSec: "файлов/сек",
    batchTotalLatency: "Время обработки пакета",
    batchResultsMatrix: "Матрица решений по файлам",
    targetFile: "Целевой файл",
    viewCode: "Показать код",
    hideCode: "Скрыть код",
    hazardDetected: "Обнаружена уязвимость"
  }
};

let currentLang = localStorage.getItem('laya_bench_lang') || 'en';
const listeners = new Set();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== 'en' && lang !== 'ru') return;
  currentLang = lang;
  localStorage.setItem('laya_bench_lang', lang);
  notifyListeners();
}

export function toggleLang() {
  setLang(currentLang === 'en' ? 'ru' : 'en');
}

export function t(key) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

export function subscribeLang(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(currentLang); } catch (e) { console.error(e); }
  });
}
