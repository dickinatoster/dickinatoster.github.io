const APP_TITLE = '王怡文｜7. 設計GAS程式｜選擇題測驗';
const QUIZ_SPREADSHEET_ID = '13UwVbuvfpiL9Tv5jh3bSl3h1omvewTmPuLW1VnvHiew'; // 記得改成你的試算表 ID
const QUIZ_SHEET_NAME = ''; // 若有特定工作表名稱請填入，留空則抓第一個分頁

function doGet() {
  // 1. 取得題庫與單字數量
  const spreadsheet = SpreadsheetApp.openById(QUIZ_SPREADSHEET_ID);
  const sheet = getQuizSheet(spreadsheet);
  const sheetName = sheet ? sheet.getName() : '工作表1';
  
  const quizDataJson = JSON.stringify(getQuizData(sheet));
  const quizSourceCount = getQuizSourceCount(sheet);

  // 2. 取得完整的前端網頁字串
  const htmlContent = getHtmlContent(quizDataJson, quizSourceCount, sheetName);

  // 3. 直接輸出 HTML 畫面
  return HtmlService.createHtmlOutput(htmlContent)
    .setTitle(APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ==========================================
// 後端資料處理邏輯
// ==========================================
function getQuizData(sheet) {
  try {
    var quizData = readQuizDataFromSpreadsheet(sheet);
    if (!quizData || !quizData.length) throw new Error('no data');
  } catch (error) {
    Logger.log('讀取試算表題庫失敗或無資料，改用內建題庫：' + error);
    var quizData = getFallbackQuizData();
  }

  // 固定取前 10 題作為本次測驗
  var finalQuiz = quizData.slice(0, 10);

  // 若不足 10 題則用備援題目補足
  if (finalQuiz.length < 10) {
    var fallback = getFallbackQuizData();
    var i = 0;
    while (finalQuiz.length < 10) {
      var src = fallback[i % fallback.length];
      finalQuiz.push({
        question: src.question,
        options: src.options.slice(),
        answer: src.answer,
        points: 10
      });
      i += 1;
    }
  }

  return finalQuiz;
}

function readQuizDataFromSpreadsheet(sheet) {
  if (!sheet) return [];

  const rows = sheet.getDataRange().getDisplayValues();
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  
  // 智慧辨識：尋找英文與中文的欄位位置
  let engIndex = findHeaderIndex(headers, ['英文', '單字', 'word', 'english', 'vocabulary', '題目']);
  let chIndex = findHeaderIndex(headers, ['中文', '解釋', '意思', 'meaning', 'chinese', '答案']);
  
  // 防呆：如果找不到對應標頭，預設第2欄為英文、第3欄為中文
  if (engIndex === -1) engIndex = rows[0].length > 2 ? 1 : 0;
  if (chIndex === -1) chIndex = rows[0].length > 2 ? 2 : 1;

  const vocabList = [];
  const allMeanings = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const engWord = String(row[engIndex] || '').trim();
    const chMeaning = String(row[chIndex] || '').trim();
    
    if (engWord && chMeaning) {
      vocabList.push({ word: engWord, meaning: chMeaning });
      allMeanings.push(chMeaning);
    }
  }

  if (vocabList.length === 0) return [];

  const quizData = [];

  for (let i = 0; i < vocabList.length; i += 1) {
    const current = vocabList[i];
    const correctMeaning = current.meaning;

    // 抽出其他單字的中文當作錯誤選項
    let wrongChoices = allMeanings.filter(function(m) { return m !== correctMeaning; });
    wrongChoices = shuffleArray(wrongChoices).slice(0, 3);

    while (wrongChoices.length < 3) {
      wrongChoices.push('其餘選項提示 ' + (wrongChoices.length + 1));
    }

    let options = [correctMeaning].concat(wrongChoices);
    options = shuffleArray(options);

    const answerIndex = options.indexOf(correctMeaning);

    quizData.push({
      question: current.word, // 乾淨的英文單字當題目
      options: options,       // 四個中文答案選項
      answer: answerIndex,
      points: 10
    });
  }

  // 隨機打亂出題順序
  return shuffleArray(quizData);
}

function getQuizSheet(spreadsheet) {
  if (QUIZ_SHEET_NAME) {
    const namedSheet = spreadsheet.getSheetByName(QUIZ_SHEET_NAME);
    if (namedSheet) return namedSheet;
  }
  return spreadsheet.getSheets()[0] || null;
}

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\u3000]/g, '')
    .replace(/[：:()（）\[\]【】.]/g, '');
}

function findHeaderIndex(headers, candidates) {
  for (let index = 0; index < headers.length; index += 1) {
    if (candidates.indexOf(headers[index]) !== -1) return index;
  }
  return -1;
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function getQuizSourceCount(sheet) {
  try {
    if (sheet) {
      var rows = sheet.getDataRange().getNumRows();
      return Math.max(0, rows - 1);
    }
  } catch (e) {
    Logger.log('無法讀取數量：' + e);
  }
  return 200;
}

function getFallbackQuizData() {
  return [
    { question: 'abroad', options: ['在國外', '放棄', '大意', '絕對'], answer: 0, points: 10 },
    { question: 'abandon', options: ['放棄', '在國外', '增加', '減少'], answer: 0, points: 10 },
    { question: 'avoid', options: ['避免', '世紀', '職業', '阻塞'], answer: 0, points: 10 }
  ];
}

// ==========================================
// 前端網頁 HTML 範本（還原 image_7f148b.png 視覺）
// ==========================================
function getHtmlContent(quizDataJson, quizSourceCount, sheetName) {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <title>選擇題測驗</title>
  <style>
    :root {
      --bg-1: #f4f6f8; --bg-2: #e9ecef; --panel: #ffffff;
      --border: #e0e4ec; --text: #1d2b36; --muted: #6c7a89; 
      --primary: #1ba098; --primary-dark: #127a74;
      --success: #2e9f71; --danger: #e16a78; --radius: 20px;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; margin: 0; background-color: #f7f9fa; }
    body {
      font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; color: var(--text);
      display: flex; justify-content: center; padding: 32px 16px;
    }
    .app { width: min(1000px, 100%); display: flex; flex-direction: column; gap: 24px; animation: appear 500ms ease both; }
    
    /* 頂部大數字統計區卡片 */
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .stat-card {
      background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); 
      padding: 20px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    .stat-card .label { display: block; font-size: 13px; color: var(--muted); font-weight: bold; margin-bottom: 8px; }
    .stat-card .value { font-size: 28px; font-weight: 800; color: #1d2b36; }

    /* 主測驗卡片 */
    .quiz-card { 
      background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); 
      padding: 36px; box-shadow: 0 6px 18px rgba(0,0,0,0.03); position: relative;
    }
    .quiz-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .instruction { font-size: 15px; color: var(--muted); font-weight: 500; }
    
    /* 工作表標籤 */
    .sheet-badge { 
      background: #e6f4ea; color: #137333; padding: 6px 14px; border-radius: 999px; 
      font-size: 13px; font-weight: 700; border: 1px solid rgba(19,115,51,0.1);
    }
    
    /* 超大單字題目 */
    .vocab-word { font-size: clamp(3rem, 7vw, 4.8rem); font-weight: 800; margin: 0 0 32px 0; color: #111e29; letter-spacing: -1px; }
    
    /* 2x2 雙排答案網格 */
    .options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    @media (max-width: 640px) { .options { grid-template-columns: 1fr; } } /* 手機自動變單排 */
    
    .option {
      width: 100%; display: flex; align-items: center; padding: 22px 24px; border-radius: 16px;
      border: 1px solid #e0e4ec; background: #ffffff; cursor: pointer; text-align: left;
      font-size: 18px; font-weight: 600; color: #2c3e50; transition: all 150ms ease;
    }
    .option:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
    .option.selected { border-color: var(--primary); background: #f0faf9; color: var(--primary-dark); box-shadow: 0 0 0 1px var(--primary); }
    .option.correct { border-color: var(--success) !important; background: #edf9f4 !important; color: #137333 !important; }
    .option.wrong { border-color: var(--danger) !important; background: #fdf2f4 !important; color: #c53929 !important; }
    .option:disabled { cursor: not-allowed; transform: none !important; }
    
    /* 進度條與頁尾 */
    .progress-container { margin: 24px 0 0 0; }
    .progress-track { height: 6px; border-radius: 999px; background: #e9ecef; overflow: hidden; }
    .progress-bar { height: 100%; width: 0%; background: var(--primary); transition: width 200ms ease; }
    
    .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f3f5; }
    .hint { color: var(--muted); font-size: 14px; }
    .actions { display: flex; gap: 12px; align-items: center; }
    
    /* 按鈕樣式 */
    .btn { border: none; border-radius: 12px; padding: 12px 24px; font: inherit; font-weight: 700; cursor: pointer; transition: all 150ms ease; font-size: 15px; }
    .btn.primary { background: #3b82f6; color: #fff; }
    .btn.primary:hover { background: #2563eb; }
    .btn.ghost { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .btn.ghost:hover { background: #e2e8f0; }
    .btn.teal { background: #139c9b; color: #fff; }
    .btn.teal:hover { background: #0e7e7d; }
    .btn:disabled { cursor: not-allowed; opacity: 0.4; }

    /* 結果報告面板 */
    .result { display: none; margin-top: 20px; padding: 28px; border-radius: var(--radius); background: #ffffff; border: 1px solid var(--border); }
    .result.show { display: block; animation: appear 400ms ease both; }
    .result .score { font-size: 48px; font-weight: 900; color: #3b82f6; margin: 10px 0; }
    .review { display: grid; gap: 12px; margin-top: 20px; }
    .review-item { padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .review-item strong { font-size: 20px; display: block; margin-bottom: 6px; }
    .meta-tags { display: flex; gap: 10px; margin-top: 6px; font-size: 14px; color: var(--muted); }
    .pill { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
    .pill.ok { background: #e6f4ea; color: #137333; }
    .pill.bad { background: #fce8e6; color: #c53929; }
    
    @keyframes appear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr; gap: 10px; } .footer { flex-direction: column; gap: 16px; align-items: stretch; text-align: center; } .actions { justify-content: center; } }
  </style>
</head>
<body>
  <main class="app">
    <section class="stats-grid">
      <div class="stat-card"><span class="label">目前題號</span><span class="value" id="statQuestion">1 / 10</span></div>
      <div class="stat-card"><span class="label">目前分數</span><span class="value" id="statScore">0</span></div>
      <div class="stat-card"><span class="label">單字來源</span><span class="value">${quizSourceCount} 個單字</span></div>
    </section>

    <section class="quiz-card">
      <div class="quiz-meta-row">
        <div class="instruction">請選出這個英文單字的正確中文意思</div>
        <div class="sheet-badge">工作表：${sheetName}</div>
      </div>
      
      <h2 id="questionText" class="vocab-word">字串載入中...</h2>
      
      <div class="options" id="options"></div>
      
      <div class="progress-container">
        <div class="progress-track"><div class="progress-bar" id="progressBar"></div></div>
      </div>

      <div class="footer">
        <div class="hint" id="hintText">請先選擇一個答案，再按下一題。</div>
        <div class="actions">
          <button class="btn ghost" id="prevBtn" type="button">上一題</button>
          <button class="btn primary" id="nextBtn" type="button">下一題</button>
          <button class="btn primary" id="submitBtn" type="button" style="display:none;">交卷看成績</button>
          <button class="btn teal" id="reloadBtn" type="button" onclick="window.location.reload()">重新抽題</button>
        </div>
      </div>
    </section>
    
    <div class="result" id="resultPanel"></div>
  </main>

  <script>
    const quizData = ${quizDataJson};
    const totalScore = quizData.length * 10;
    const state = { currentIndex: 0, answers: Array(quizData.length).fill(null), submitted: false };

    const questionText = document.getElementById('questionText');
    const options = document.getElementById('options');
    const progressBar = document.getElementById('progressBar');
    const hintText = document.getElementById('hintText');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const resultPanel = document.getElementById('resultPanel');
    const statQuestion = document.getElementById('statQuestion');
    const statScore = document.getElementById('statScore');

    function renderQuestion() {
      const currentQuestion = quizData[state.currentIndex];
      const savedAnswer = state.answers[state.currentIndex];

      // 呈現大題目與統計狀態
      questionText.textContent = currentQuestion.question;
      statQuestion.textContent = (state.currentIndex + 1) + ' / ' + quizData.length;
      progressBar.style.width = ((state.currentIndex + 1) / quizData.length * 100) + '%';
      
      options.innerHTML = '';

      // 生成 2x2 無字母網格按鈕
      currentQuestion.options.forEach((option, optionIndex) => {
        const button = document.createElement('button');
        button.type = 'button'; 
        button.className = 'option';
        button.textContent = option;
        
        if (savedAnswer === optionIndex) button.classList.add('selected');

        if (state.submitted) {
          button.disabled = true;
          if (optionIndex === currentQuestion.answer) button.classList.add('correct');
          if (savedAnswer === optionIndex && optionIndex !== currentQuestion.answer) button.classList.add('wrong');
        }

        button.addEventListener('click', () => {
          if (state.submitted) return;
          state.answers[state.currentIndex] = optionIndex;
          renderQuestion();
        });
        options.appendChild(button);
      });

      // 控制按鈕顯示與唯讀
      prevBtn.disabled = state.currentIndex === 0;
      
      if (!state.submitted) {
        if (state.currentIndex === quizData.length - 1) {
          nextBtn.style.display = 'none';
          submitBtn.style.display = 'inline-flex';
        } else {
          nextBtn.style.display = 'inline-flex';
          submitBtn.style.display = 'none';
        }
      } else {
        nextBtn.style.display = state.currentIndex === quizData.length - 1 ? 'none' : 'inline-flex';
        submitBtn.style.display = 'none';
      }

      const hasAnswer = state.answers[state.currentIndex] !== null;
      hintText.textContent = state.submitted ? '已交卷，以下是答案解析。' : (hasAnswer ? '此題已選，可進入下一題。' : '請選出一個最接近的中文意思。');
    }

    function goToQuestion(index) {
      state.currentIndex = Math.max(0, Math.min(index, quizData.length - 1));
      renderQuestion();
    }

    function calculateScore() {
      let correctCount = 0, score = 0;
      const review = [];
      quizData.forEach((item, index) => {
        const answerIndex = state.answers[index];
        const isCorrect = answerIndex === item.answer;
        if (isCorrect) { correctCount += 1; score += 10; }
        review.push({ 
          question: item.question, 
          picked: answerIndex === null ? '未作答' : item.options[answerIndex], 
          correct: item.options[item.answer], 
          isCorrect: isCorrect 
        });
      });
      return { score, correctCount, review };
    }

    function submitQuiz() {
      if (state.answers.includes(null)) {
        if (!confirm("還有題目未作答，確定要直接交卷嗎？")) return;
      }
      state.submitted = true;
      const result = calculateScore();
      
      statScore.textContent = result.score;
      resultPanel.classList.add('show');
      resultPanel.innerHTML = '<h3>測驗結果報告</h3>' +
        '<div class="score">' + result.score + ' <span style="font-size:20px;color:#666;">/ ' + totalScore + ' 分</span></div>' +
        '<p>共 ' + quizData.length + ' 題，答對了 ' + result.correctCount + ' 題。</p>' +
        '<div class="review">' + result.review.map((item, index) => 
          '<div class="review-item"><strong>' + (index + 1) + '. ' + item.question + '</strong>' +
          '<div class="meta-tags"><span class="pill ' + (item.isCorrect ? 'ok' : 'bad') + '">' + (item.isCorrect ? '答對' : '答錯') + '</span>' +
          '<span>你的選擇：' + item.picked + '</span> │ <span>正確答案：' + item.correct + '</span></div></div>'
        ).join('') + '</div>';
      
      renderQuestion();
      resultPanel.scrollIntoView({ behavior: 'smooth' });
    }

    prevBtn.addEventListener('click', () => { if (state.currentIndex > 0) goToQuestion(state.currentIndex - 1); });
    nextBtn.addEventListener('click', () => { if (state.currentIndex < quizData.length - 1) goToQuestion(state.currentIndex + 1); });
    submitBtn.addEventListener('click', submitQuiz);
    
    renderQuestion();
  </script>
</body>
</html>`;
}