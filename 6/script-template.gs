// ============================================================================
// Google Apps Script - 雲端記事本後端範本
// ============================================================================
// 
// 使用說明：
// 1. 複製此代碼
// 2. 前往 https://script.google.com
// 3. 建立新專案
// 4. 貼上此代碼
// 5. 部署為 Web App（執行身分為您，允許任何人存取）
// 6. 複製 Web App URL 到 index.html 中的 GAS_SCRIPT_URL
//
// ============================================================================

// 主要設定
const FOLDER_NAME = "CloudNotepad";  // Google Drive 中的資料夾名稱

// ============================================================================
// doGet 和 doPost 處理程序
// ============================================================================

/**
 * 處理 GET 請求（獲取檔案清單、載入檔案等）
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    Logger.log("GET 請求，操作: " + action);
    
    switch (action) {
      case "listFiles":
        return listUserFiles();
      case "getFile":
        return getFileContent(e.parameter.fileId);
      case "getUserInfo":
        return getUserInfo();
      default:
        return sendResponse(false, "未知的操作");
    }
  } catch (error) {
    Logger.log("錯誤: " + error.toString());
    return sendResponse(false, error.toString());
  }
}

/**
 * 處理 POST 請求（儲存檔案、建立新檔案等）
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    const content = e.postData.contents;
    
    Logger.log("POST 請求，操作: " + action);
    
    switch (action) {
      case "saveFile":
        const data = JSON.parse(content);
        return saveFile(data.filename, data.content);
      case "createFile":
        const fileData = JSON.parse(content);
        return createFile(fileData.filename);
      case "deleteFile":
        const deleteData = JSON.parse(content);
        return deleteFile(deleteData.fileId);
      default:
        return sendResponse(false, "未知的操作");
    }
  } catch (error) {
    Logger.log("錯誤: " + error.toString());
    return sendResponse(false, error.toString());
  }
}

// ============================================================================
// 檔案操作函數
// ============================================================================

/**
 * 獲取或建立雲端記事本資料夾
 */
function getNotepadFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(FOLDER_NAME);
  }
}

/**
 * 列出用戶的所有筆記檔案
 */
function listUserFiles() {
  try {
    const folder = getNotepadFolder();
    const files = folder.getFilesByType(MimeType.PLAIN_TEXT);
    const fileList = [];
    
    while (files.hasNext()) {
      const file = files.next();
      fileList.push({
        id: file.getId(),
        name: file.getName(),
        lastModified: file.getLastUpdated(),
        size: file.getSize()
      });
    }
    
    return sendResponse(true, "成功獲取檔案清單", fileList);
  } catch (error) {
    return sendResponse(false, error.toString());
  }
}

/**
 * 根據檔案 ID 獲取檔案內容
 */
function getFileContent(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const content = file.getBlob().getDataAsString('UTF-8');
    
    return sendResponse(true, "成功獲取檔案", {
      id: file.getId(),
      name: file.getName(),
      content: content,
      lastModified: file.getLastUpdated()
    });
  } catch (error) {
    return sendResponse(false, error.toString());
  }
}

/**
 * 儲存或更新檔案
 */
function saveFile(filename, content) {
  try {
    const folder = getNotepadFolder();
    const safeFilename = sanitizeFilename(filename) + ".txt";
    
    // 查找是否已存在相同名稱的檔案
    const files = folder.getFilesByName(safeFilename);
    let file;
    
    if (files.hasNext()) {
      file = files.next();
      // 更新現有檔案
      file.setContent(content);
      Logger.log("已更新檔案: " + safeFilename);
    } else {
      // 建立新檔案
      file = folder.createFile(safeFilename, content, MimeType.PLAIN_TEXT);
      Logger.log("已建立新檔案: " + safeFilename);
    }
    
    return sendResponse(true, "檔案已儲存", {
      id: file.getId(),
      name: file.getName(),
      lastModified: file.getLastUpdated()
    });
  } catch (error) {
    return sendResponse(false, error.toString());
  }
}

/**
 * 建立新檔案
 */
function createFile(filename) {
  try {
    const folder = getNotepadFolder();
    const safeFilename = sanitizeFilename(filename) + ".txt";
    const file = folder.createFile(safeFilename, "", MimeType.PLAIN_TEXT);
    
    return sendResponse(true, "檔案已建立", {
      id: file.getId(),
      name: file.getName()
    });
  } catch (error) {
    return sendResponse(false, error.toString());
  }
}

/**
 * 刪除檔案
 */
function deleteFile(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const filename = file.getName();
    file.setTrashed(true);
    
    return sendResponse(true, "檔案已刪除: " + filename);
  } catch (error) {
    return sendResponse(false, error.toString());
  }
}

/**
 * 獲取用戶信息
 */
function getUserInfo() {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    return sendResponse(true, "成功獲取用戶信息", {
      email: userEmail,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return sendResponse(false, error.toString());
  }
}

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 清理檔案名稱（移除不允許的字符）
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

/**
 * 發送統一格式的響應
 */
function sendResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    data: data
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 測試函數（在 Script Editor 中運行）
// ============================================================================

/**
 * 測試檔案建立和儲存
 */
function testSaveFile() {
  const result = saveFile("測試筆記", "這是一個測試筆記。\n建立於: " + new Date().toLocaleString('zh-TW'));
  Logger.log(JSON.stringify(result));
}

/**
 * 測試列出檔案
 */
function testListFiles() {
  const result = listUserFiles();
  Logger.log(JSON.stringify(result));
}

/**
 * 測試用戶信息
 */
function testGetUserInfo() {
  const result = getUserInfo();
  Logger.log(JSON.stringify(result));
}

// ============================================================================
// 部署說明
// ============================================================================
/*

部署步驟：

1. 建立新的 Google Apps Script 專案
   - 訪問 https://script.google.com
   - 點擊 "新增專案"

2. 複製並粘貼此代碼到編輯器

3. 保存專案（按 Ctrl+S 或 Cmd+S）

4. 部署為 Web App
   - 點擊 "部署"
   - 選擇 "新增部署"
   - 選擇類型：Web App
   - 執行身分：選擇您的帳戶
   - 允許誰存取：選擇 "任何人"
   - 點擊 "部署"

5. 複製 Deployment ID（開頭為 AKfycby...）

6. Web App URL 格式為：
   https://script.google.com/macros/d/{DEPLOYMENT_ID}/userweb

7. 將此 URL 粘貼到 index.html 中的 GAS_SCRIPT_URL 變數

8. 測試功能

*/
