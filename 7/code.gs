const APP_TITLE = '王怡文｜7. 設計GAS程式｜選擇題測驗';
const QUIZ_SPREADSHEET_ID = '13UwVbuvfpiL9Tv5jh3bSl3h1omvewTmPuLW1VnvHiew';
const QUIZ_SHEET_NAME = '';

function doGet() {
  const template = HtmlService.createTemplateFromFile('index');
  template.quizDataJson = JSON.stringify(getQuizData());

  return template.evaluate()
    .setTitle(APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getQuizData() {
  try {
    const quizData = readQuizDataFromSpreadsheet();
    if (quizData.length > 0) {
      return quizData;
    }
  } catch (error) {
    Logger.log('讀取試算表題庫失敗：' + error);
  }

  return getFallbackQuizData();
}

function readQuizDataFromSpreadsheet() {
  const spreadsheet = SpreadsheetApp.openById(QUIZ_SPREADSHEET_ID);
  const sheet = getQuizSheet(spreadsheet);

  if (!sheet) {
    return [];
  }

  const rows = sheet.getDataRange().getDisplayValues();
  if (!rows || rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);
  const columnMap = buildColumnMap(headers);
  const quizData = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const item = buildQuizItemFromRow(row, columnMap);
    if (item) {
      quizData.push(item);
    }
  }

  return quizData;
}

function getQuizSheet(spreadsheet) {
  if (QUIZ_SHEET_NAME) {
    const namedSheet = spreadsheet.getSheetByName(QUIZ_SHEET_NAME);
    if (namedSheet) {
      return namedSheet;
    }
  }

  return spreadsheet.getSheets()[0] || null;
}

function buildColumnMap(headers) {
  return {
    question: findHeaderIndex(headers, ['題目', '問題', 'question', 'quiz', '題幹']),
    optionA: findHeaderIndex(headers, ['a', '選項a', '選項1', 'option1', '答案a']),
    optionB: findHeaderIndex(headers, ['b', '選項b', '選項2', 'option2', '答案b']),
    optionC: findHeaderIndex(headers, ['c', '選項c', '選項3', 'option3', '答案c']),
    optionD: findHeaderIndex(headers, ['d', '選項d', '選項4', 'option4', '答案d']),
    answer: findHeaderIndex(headers, ['答案', '正確答案', 'answer', 'answerkey', '正解']),
    points: findHeaderIndex(headers, ['分數', '配分', 'score', 'points'])
  };
}

function buildQuizItemFromRow(row, columnMap) {
  const question = getCellValue(row, columnMap.question, 0);
  const options = [
    getCellValue(row, columnMap.optionA, 1),
    getCellValue(row, columnMap.optionB, 2),
    getCellValue(row, columnMap.optionC, 3),
    getCellValue(row, columnMap.optionD, 4)
  ].filter(Boolean);

  if (!question || options.length < 2) {
    return null;
  }

  const answerValue = getCellValue(row, columnMap.answer, 5);
  const answer = parseAnswerIndex(answerValue, options);
  const pointsValue = getCellValue(row, columnMap.points, 6);
  const points = parsePoints(pointsValue, options.length);

  return {
    question: question,
    options: options,
    answer: answer,
    points: points
  };
}

function getCellValue(row, index, fallbackIndex) {
  const value = row && index >= 0 ? row[index] : '';
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    return String(value).trim();
  }

  const fallbackValue = row && fallbackIndex >= 0 ? row[fallbackIndex] : '';
  return fallbackValue !== undefined && fallbackValue !== null ? String(fallbackValue).trim() : '';
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
    if (candidates.indexOf(headers[index]) !== -1) {
      return index;
    }
  }

  return -1;
}

function parseAnswerIndex(value, options) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 0;
  }

  const numeric = Number(normalized);
  if (!Number.isNaN(numeric)) {
    if (numeric >= 1 && numeric <= options.length) {
      return numeric - 1;
    }
    if (numeric >= 0 && numeric < options.length) {
      return numeric;
    }
  }

  const letter = normalized.toUpperCase();
  const letterIndex = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(letter);
  if (letterIndex >= 0 && letterIndex < options.length) {
    return letterIndex;
  }

  const optionIndex = options.findIndex(function (option) {
    return normalizeHeader(option) === normalizeHeader(normalized);
  });

  return optionIndex >= 0 ? optionIndex : 0;
}

function parsePoints(value, optionCount) {
  const numeric = Number(String(value || '').trim());
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric;
  }

  return 10;
}

function getFallbackQuizData() {
  return [
    {
      question: '在 Google Apps Script 中，哪一個函式通常用來提供網頁入口？',
      options: ['doGet()', 'main()', 'startApp()', 'renderPage()'],
      answer: 0,
      points: 10
    },
    {
      question: '如果要建立一個可直接在瀏覽器顯示的頁面，應該優先使用哪個服務？',
      options: ['HtmlService', 'DriveApp', 'SpreadsheetApp', 'MailApp'],
      answer: 0,
      points: 10
    },
    {
      question: '要讀取試算表資料，最常用的 GAS 類別是哪一個？',
      options: ['SpreadsheetApp', 'PropertiesService', 'LockService', 'CacheService'],
      answer: 0,
      points: 10
    },
    {
      question: '若想把資料寫入 Google 雲端硬碟，通常會使用哪個服務？',
      options: ['DriveApp', 'Browser', 'UrlFetchApp', 'Session'],
      answer: 0,
      points: 10
    },
    {
      question: '下列哪一個功能最適合記錄除錯訊息？',
      options: ['Logger.log()', 'alert()', 'console.table()', 'print()'],
      answer: 0,
      points: 10
    },
    {
      question: '要將網頁部署成 Web App，通常需要在什麼地方設定？',
      options: ['部署 / 新部署', '檔案 / 另存新檔', '編輯 / 偏好設定', '執行 / 測試模式'],
      answer: 0,
      points: 10
    },
    {
      question: '如果想儲存少量設定值，例如分數或使用者狀態，哪個服務最合適？',
      options: ['PropertiesService', 'MimeType', 'CalendarApp', 'DocumentApp'],
      answer: 0,
      points: 10
    },
    {
      question: '哪一個物件常用來獲取目前使用者的資訊或時區？',
      options: ['Session', 'FormApp', 'SlidesApp', 'LockService'],
      answer: 0,
      points: 10
    },
    {
      question: '在 HTML 頁面中，若要把 GAS 資料傳回前端，常見方式是什麼？',
      options: ['google.script.run', 'fetch() 直接讀 Apps Script 內部函式', 'window.drive.send()', 'script.callServer()'],
      answer: 0,
      points: 10
    },
    {
      question: '下列哪一個工具可用來格式化日期與時間？',
      options: ['Utilities.formatDate()', 'SpreadsheetApp.format()', 'DriveApp.date()', 'HtmlService.format()'],
      answer: 0,
      points: 10
    }
  ];
}