const RAW_FOLDER_ID = '1A0YEGTCBtOu9-e8lZPKZm9eDecrYhXhn?usp=sharing';
const NOTE_FILE_NAME = '記事本.txt';
const APP_TITLE = '雲端記事本';
const STATUS_READY = '已就緒';
const STATUS_SAVING = '儲存中...';
const STATUS_SAVED = '已儲存';
const STATUS_ERROR = '發生錯誤';

function doGet() {
  ensureNotebookFile();
  return HtmlService.createHtmlOutput(buildAppHtml())
    .setTitle(APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function loadNotebook() {
  try {
    const file = ensureNotebookFile();
    return buildResult(true, '載入成功', {
      title: APP_TITLE,
      fileName: file.getName(),
      content: file.getBlob().getDataAsString('UTF-8'),
      lastUpdated: formatDateTime(file.getLastUpdated()),
      folderName: getNotebookFolder().getName()
    });
  } catch (error) {
    return buildResult(false, getErrorMessage(error));
  }
}

function saveNotebook(content) {
  try {
    const file = ensureNotebookFile();
    file.setContent(normalizeText(content));
    return buildResult(true, '儲存成功', {
      fileName: file.getName(),
      lastUpdated: formatDateTime(file.getLastUpdated())
    });
  } catch (error) {
    return buildResult(false, getErrorMessage(error));
  }
}

function ensureNotebookFile() {
  const properties = PropertiesService.getScriptProperties();
  const storedFileId = properties.getProperty('NOTEBOOK_FILE_ID');

  if (storedFileId) {
    try {
      const file = DriveApp.getFileById(storedFileId);
      if (file && file.getName() === NOTE_FILE_NAME) {
        return file;
      }
    } catch (error) {
      properties.deleteProperty('NOTEBOOK_FILE_ID');
    }
  }

  const folder = getNotebookFolder();
  const existing = folder.getFilesByName(NOTE_FILE_NAME);

  if (existing.hasNext()) {
    const file = existing.next();
    properties.setProperty('NOTEBOOK_FILE_ID', file.getId());
    return file;
  }

  const file = folder.createFile(NOTE_FILE_NAME, '', MimeType.PLAIN_TEXT);
  properties.setProperty('NOTEBOOK_FILE_ID', file.getId());
  return file;
}

function getNotebookFolder() {
  const folderId = extractFolderId(RAW_FOLDER_ID);
  return DriveApp.getFolderById(folderId);
}

function extractFolderId(rawValue) {
  return String(rawValue || '').split('?')[0].trim();
}

function normalizeText(value) {
  return String(value == null ? '' : value).replace(/\r\n/g, '\n');
}

function formatDateTime(date) {
  if (!date) {
    return '未修改';
  }

  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss');
}

function buildResult(success, message, data) {
  return {
    success: success,
    message: message,
    data: data || null
  };
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function buildAppHtml() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_TITLE}</title>
  <style>
    :root {
      --bg-a: #f5e6fb;
      --bg-b: #d9c0ef;
      --panel: rgba(255, 255, 255, 0.92);
      --panel-border: rgba(166, 122, 196, 0.18);
      --primary: #b56bd8;
      --primary-dark: #9b4fc2;
      --text: #2f2438;
      --muted: #766683;
      --shadow: 0 24px 80px rgba(82, 36, 114, 0.18);
      --radius: 22px;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
    }

    body {
      margin: 0;
      font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.48), transparent 35%),
        radial-gradient(circle at bottom right, rgba(255,255,255,0.34), transparent 28%),
        linear-gradient(135deg, var(--bg-a), var(--bg-b));
      display: grid;
      place-items: center;
      padding: 18px;
    }

    .shell {
      width: min(960px, 100%);
      min-height: min(90vh, 920px);
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(18px);
    }

    .header {
      padding: 22px 26px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: linear-gradient(135deg, rgba(181,107,216,0.96), rgba(155,79,194,0.96));
      color: #fff;
    }

    .title-block h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0.02em;
    }

    .title-block p {
      margin: 6px 0 0;
      font-size: 13px;
      opacity: 0.92;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.18);
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #ffd86b;
      box-shadow: 0 0 0 0 rgba(255, 216, 107, 0.55);
      animation: pulse 1.8s infinite;
    }

    .dot.saved {
      background: #83f08b;
      animation: none;
      box-shadow: none;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 216, 107, 0.55); }
      70% { box-shadow: 0 0 0 11px rgba(255, 216, 107, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 216, 107, 0); }
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 22px 26px 26px;
      flex: 1;
      min-height: 0;
    }

    .meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      border-bottom: 1px solid rgba(138, 100, 160, 0.14);
      padding-bottom: 14px;
    }

    .file-name {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .file-icon {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(181,107,216,0.16), rgba(155,79,194,0.26));
      font-size: 18px;
    }

    .file-name input {
      border: none;
      background: transparent;
      color: var(--primary-dark);
      font-size: 18px;
      font-weight: 700;
      padding: 0;
      min-width: 0;
      width: min(100%, 260px);
      outline: none;
    }

    .status-note {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .editor-wrap {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    #editor {
      width: 100%;
      flex: 1;
      min-height: 0;
      resize: none;
      border: 1px solid rgba(155, 79, 194, 0.16);
      border-radius: 18px;
      background: rgba(255,255,255,0.86);
      padding: 18px 18px 22px;
      font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
      font-size: 16px;
      line-height: 1.75;
      color: var(--text);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
      outline: none;
    }

    #editor:focus {
      border-color: rgba(181, 107, 216, 0.55);
      box-shadow: 0 0 0 4px rgba(181, 107, 216, 0.12);
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 14px;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(155, 79, 194, 0.12);
      color: var(--muted);
      font-size: 13px;
    }

    .footer-left, .footer-right {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .btn {
      border: none;
      border-radius: 14px;
      padding: 11px 20px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #fff;
      box-shadow: 0 12px 24px rgba(155, 79, 194, 0.22);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: progress;
    }

    .btn-ghost {
      background: rgba(255,255,255,0.86);
      color: var(--text);
      border: 1px solid rgba(155, 79, 194, 0.14);
    }

    .toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translateX(-50%) translateY(20px);
      background: rgba(33, 24, 40, 0.94);
      color: #fff;
      padding: 12px 16px;
      border-radius: 14px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease, transform 0.22s ease;
      font-size: 13px;
      max-width: min(90vw, 520px);
      text-align: center;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 720px) {
      body {
        padding: 10px;
      }

      .header, .content {
        padding-left: 16px;
        padding-right: 16px;
      }

      .title-block h1 {
        font-size: 22px;
      }

      #editor {
        font-size: 15px;
      }

      .footer {
        align-items: stretch;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="header">
      <div class="title-block">
        <h1>☁️ 雲端記事本</h1>
        <p>直接使用 GAS 讀寫 Google 雲端資料夾，預設開啟記事本.txt</p>
      </div>
      <div class="badge"><span id="statusDot" class="dot"></span><span id="statusText">${STATUS_READY}</span></div>
    </header>

    <section class="content">
      <div class="meta">
        <div class="file-name">
          <div class="file-icon">📄</div>
          <input id="fileName" type="text" value="${NOTE_FILE_NAME}" readonly>
        </div>
        <div class="status-note" id="statusNote">載入中...</div>
      </div>

      <div class="editor-wrap">
        <textarea id="editor" placeholder="開始輸入您的筆記..."></textarea>
      </div>

      <div class="footer">
        <div class="footer-left">
          <span>字數：<strong id="charCount">0</strong></span>
          <span>最後修改：<strong id="lastUpdated">未修改</strong></span>
        </div>
        <div class="footer-right">
          <button class="btn btn-ghost" id="reloadBtn" type="button">重新載入</button>
          <button class="btn btn-primary" id="saveBtn" type="button">Save</button>
        </div>
      </div>
    </section>
  </main>

  <div class="toast" id="toast"></div>

  <script>
    const editor = document.getElementById('editor');
    const saveBtn = document.getElementById('saveBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const statusNote = document.getElementById('statusNote');
    const charCount = document.getElementById('charCount');
    const lastUpdated = document.getElementById('lastUpdated');
    const toast = document.getElementById('toast');

    let isDirty = false;
    let loading = false;
    let saveTimer = null;

    function setStatus(text, state) {
      statusText.textContent = text;
      statusDot.classList.toggle('saved', state === 'saved');
      statusNote.textContent = text;
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function updateCounts() {
      charCount.textContent = editor.value.length.toString();
    }

    function markDirty() {
      isDirty = true;
      setStatus('尚未儲存', 'dirty');
    }

    function loadNotebook() {
      loading = true;
      saveBtn.disabled = true;
      reloadBtn.disabled = true;
      setStatus('載入中...', 'loading');

      google.script.run
        .withSuccessHandler((result) => {
          loading = false;
          saveBtn.disabled = false;
          reloadBtn.disabled = false;

          if (result && result.success) {
            editor.value = result.data && result.data.content ? result.data.content : '';
            lastUpdated.textContent = (result.data && result.data.lastUpdated) ? result.data.lastUpdated : '未修改';
            document.getElementById('fileName').value = result.data && result.data.fileName ? result.data.fileName : '記事本.txt';
            updateCounts();
            isDirty = false;
            setStatus('${STATUS_READY}', 'ready');
            showToast(result.message || '載入完成');
          } else {
            setStatus('${STATUS_ERROR}', 'error');
            showToast((result && result.message) ? result.message : '載入失敗');
          }
        })
        .withFailureHandler((error) => {
          loading = false;
          saveBtn.disabled = false;
          reloadBtn.disabled = false;
          setStatus('${STATUS_ERROR}', 'error');
          showToast(error && error.message ? error.message : String(error));
        })
        .loadNotebook();
    }

    function saveNotebook() {
      if (loading) {
        return;
      }

      const content = editor.value;
      saveBtn.disabled = true;
      reloadBtn.disabled = true;
      setStatus('${STATUS_SAVING}', 'loading');

      google.script.run
        .withSuccessHandler((result) => {
          saveBtn.disabled = false;
          reloadBtn.disabled = false;

          if (result && result.success) {
            isDirty = false;
            lastUpdated.textContent = (result.data && result.data.lastUpdated) ? result.data.lastUpdated : '未修改';
            setStatus('${STATUS_SAVED}', 'saved');
            showToast(result.message || '已儲存');
          } else {
            setStatus('${STATUS_ERROR}', 'error');
            showToast((result && result.message) ? result.message : '儲存失敗');
          }
        })
        .withFailureHandler((error) => {
          saveBtn.disabled = false;
          reloadBtn.disabled = false;
          setStatus('${STATUS_ERROR}', 'error');
          showToast(error && error.message ? error.message : String(error));
        })
        .saveNotebook(content);
    }

    editor.addEventListener('input', () => {
      updateCounts();
      markDirty();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (isDirty) {
          setStatus('尚未儲存', 'dirty');
        }
      }, 250);
    });

    editor.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveNotebook();
      }
    });

    saveBtn.addEventListener('click', saveNotebook);
    reloadBtn.addEventListener('click', loadNotebook);

    window.addEventListener('beforeunload', (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    });

    updateCounts();
    loadNotebook();
  </script>
</body>
</html>`;
}
