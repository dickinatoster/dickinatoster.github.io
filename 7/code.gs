const APP_TITLE = '英文單字測驗';
const QUIZ_SIZE = 10;
const POINTS_PER_QUESTION = 10;
const TOTAL_SCORE = QUIZ_SIZE * POINTS_PER_QUESTION;
const SPREADSHEET_ID = '1PHc9TZ2QkhUhTklXJlLPsqArv-SopLpdYZ0YCcj9HtQ';
const SHEET_CANDIDATES = ['工作表1', '題庫', 'Quiz', 'Sheet1'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getQuizPayload() {
  const bank = loadQuestionBank();
  const questions = pickQuestions(bank, QUIZ_SIZE);

  return {
    success: true,
    title: APP_TITLE,
    totalScore: TOTAL_SCORE,
    questionCount: questions.length,
    pointsPerQuestion: POINTS_PER_QUESTION,
    sourceLabel: bank.sourceLabel,
    questions: questions
  };
}

function gradeQuiz(request) {
  const bank = loadQuestionBank();
  const questions = pickQuestions(bank, QUIZ_SIZE);
  const answers = Array.isArray(request && request.answers) ? request.answers : [];
  let score = 0;
  const results = questions.map(function (question, index) {
    const selectedIndex = Number(answers[index]);
    const isCorrect = selectedIndex === question.correctIndex;

    if (isCorrect) {
      score += POINTS_PER_QUESTION;
    }

    return {
      word: question.word,
      selectedIndex: selectedIndex,
      correctIndex: question.correctIndex,
      isCorrect: isCorrect,
      explanation: question.explanation
    };
  });

  return {
    success: true,
    score: score,
    totalScore: TOTAL_SCORE,
    questionCount: questions.length,
    results: results
  };
}

function loadQuestionBank() {
  const sheetInfo = tryLoadSheetQuestionBank();
  if (sheetInfo.questions.length) {
    return sheetInfo;
  }

  return {
    sourceLabel: '內建題庫',
    questions: getFallbackQuestionBank()
  };
}

function tryLoadSheetQuestionBank() {
  const spreadsheet = getQuestionSpreadsheet();
  if (!spreadsheet) {
    return { sourceLabel: '內建題庫', questions: [] };
  }

  for (let i = 0; i < SHEET_CANDIDATES.length; i++) {
    const name = SHEET_CANDIDATES[i];
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) {
      continue;
    }

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return { sourceLabel: '工作表：' + name, questions: [] };
    }

    const header = values.shift().map(function (cell) {
      return String(cell || '').trim();
    });
    const rows = values
      .map(function (row) {
        return normalizeSheetRow(row, header);
      })
      .filter(function (entry) {
        return entry.word && entry.answer;
      });

    if (!rows.length) {
      return { sourceLabel: '工作表：' + name, questions: [] };
    }

    return {
      sourceLabel: '工作表：' + name,
      questions: rows.map(function (entry) {
        const distractors = buildDistractors(entry, rows);
        const options = shuffleArray([entry.answer].concat(distractors).slice(0, 4));
        return buildQuestion(entry.word, entry.answer, options, entry.explanation || '');
      })
    };
  }

  return { sourceLabel: '內建題庫', questions: [] };
}

function getQuestionSpreadsheet() {
  try {
    if (SPREADSHEET_ID) {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (error) {
    // Fall back to the active spreadsheet below.
  }

  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (error) {
    return null;
  }
}

function normalizeSheetRow(row, header) {
  const wordIndex = findHeaderIndex(header, ['英文', '單字', 'word', 'english']);
  const answerIndex = findHeaderIndex(header, ['中文', '解釋', 'answer', 'meaning']);
  const explanationIndex = findHeaderIndex(header, ['說明', '備註', 'explanation', 'note']);
  const optionsStart = findHeaderIndex(header, ['選項1', 'option1', '選項Ａ', 'distractor1']);

  const word = String(getCell(row, wordIndex, 0) || '').trim();
  const answer = String(getCell(row, answerIndex, 1) || '').trim();
  const explanation = String(getCell(row, explanationIndex, 2) || '').trim();
  const options = [];

  if (optionsStart >= 0) {
    for (let i = optionsStart; i < row.length; i++) {
      const value = String(row[i] || '').trim();
      if (value) {
        options.push(value);
      }
    }
  }

  return {
    word: word,
    answer: answer,
    explanation: explanation,
    options: options
  };
}

function getCell(row, index, fallbackIndex) {
  if (index >= 0 && row[index] !== undefined) {
    return row[index];
  }
  return row[fallbackIndex];
}

function findHeaderIndex(header, candidates) {
  for (let i = 0; i < header.length; i++) {
    const value = header[i].toLowerCase();
    if (candidates.some(function (candidate) {
      return value === candidate.toLowerCase() || value.indexOf(candidate.toLowerCase()) !== -1;
    })) {
      return i;
    }
  }
  return -1;
}

function buildDistractors(entry, rows) {
  if (Array.isArray(entry.options) && entry.options.length) {
    return entry.options.filter(function (option) {
      return option !== entry.answer;
    }).slice(0, 3);
  }

  const pool = rows
    .map(function (row) {
      return row.answer;
    })
    .filter(function (answer) {
      return answer && answer !== entry.answer;
    });

  return shuffleArray(uniqueValues(pool)).slice(0, 3);
}

function pickQuestions(bank, count) {
  const source = shuffleArray(bank.questions.slice());
  return source.slice(0, Math.min(count, source.length));
}

function buildQuestion(word, answer, options, explanation) {
  const normalizedOptions = uniqueValues(options.concat([answer])).slice(0, 4);
  while (normalizedOptions.length < 4) {
    normalizedOptions.push(answer + '（同義）');
  }

  const shuffledOptions = shuffleArray(normalizedOptions);
  const correctIndex = shuffledOptions.indexOf(answer);

  return {
    word: word,
    answer: answer,
    options: shuffledOptions,
    correctIndex: correctIndex < 0 ? 0 : correctIndex,
    explanation: explanation || ''
  };
}

function getFallbackQuestionBank() {
  return [
    buildQuestion('advantage', '優點；優勢', ['優點；優勢', '老闆', '勇敢的', '日曆；行事曆'], 'advantage 表示有利條件或優點。'),
    buildQuestion('calendar', '日曆；行事曆', ['日曆；行事曆', '優點；優勢', '資料夾', '擴音器'], 'calendar 是記錄日期與月份的表。'),
    buildQuestion('brave', '勇敢的', ['勇敢的', '平靜的', '吵雜的', '明亮的'], 'brave 用來形容勇敢、不害怕。'),
    buildQuestion('boss', '老闆', ['老闆', '同學', '鄰居', '助手'], 'boss 是主管或老闆。'),
    buildQuestion('popular', '受歡迎的', ['受歡迎的', '迅速的', '透明的', '疲倦的'], 'popular 表示很多人喜歡。'),
    buildQuestion('perhaps', '也許；可能', ['也許；可能', '一定', '昨天', '永遠'], 'perhaps 表示不確定的推測。'),
    buildQuestion('improve', '改善；進步', ['改善；進步', '破壞', '停止', '遺忘'], 'improve 是讓事情變得更好。'),
    buildQuestion('receive', '收到', ['收到', '發送', '製作', '修理'], 'receive 是接受或收到。'),
    buildQuestion('research', '研究；調查', ['研究；調查', '跑步', '洗澡', '旅行'], 'research 是仔細地探究。'),
    buildQuestion('support', '支持；支援', ['支持；支援', '懷疑', '阻止', '切換'], 'support 表示幫助或贊同。'),
    buildQuestion('value', '價值；重要性', ['價值；重要性', '速度', '角落', '天氣'], 'value 表示值得程度或價格。'),
    buildQuestion('wonder', '想知道；驚奇', ['想知道；驚奇', '倒塌', '裝飾', '微笑'], 'wonder 可作動詞或名詞。')
  ];
}

function shuffleArray(values) {
  const result = values.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

function uniqueValues(values) {
  const seen = {};
  return values.filter(function (value) {
    const key = String(value).trim();
    if (!key || seen[key]) {
      return false;
    }
    seen[key] = true;
    return true;
  });
}
