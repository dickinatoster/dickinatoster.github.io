# ☁️ 雲端記事本 - Google Drive 集成版

## 📋 項目概述

此項目提供一個功能完整的雲端記事本應用，支援：
- 🔐 Google Drive 集成
- 💾 自動本地備份
- ⌨️ 快捷鍵快速儲存（Ctrl+S）
- 📝 即時字數計算
- 🔄 多檔案管理
- 📱 響應式設計，支援各種設備

---

## 🚀 快速開始

### 第 1 步：準備 Google Cloud 專案

1. **建立 Google Cloud 專案**
   - 訪問 [Google Cloud Console](https://console.cloud.google.com/)
   - 點擊專案下拉選單
   - 點擊 "新增專案"
   - 輸入專案名稱（例如：CloudNotepad）
   - 點擊 "建立"

2. **啟用必要的 API**
   - 在 Cloud Console 中，搜尋並啟用以下 API：
     - Google Drive API
     - Google Apps Script API

3. **建立 OAuth 2.0 客戶端**
   - 進入「憑證」
   - 點擊「建立憑證」→ 「OAuth 2.0 客戶端 ID」
   - 選擇應用類型：「網頁應用程式」
   - 新增授權重定向 URI：你的網站 URL + `/6/`
   - 記下 Client ID 和 Client Secret

---

### 第 2 步：建立 Google Apps Script 專案

1. **建立新的 Apps Script 專案**
   - 訪問 [Google Apps Script](https://script.google.com/)
   - 點擊 "新增專案"
   - 命名為 "CloudNotepad"

2. **複製後端代碼**
   - 打開 `script-template.gs` 文件
   - 複製全部代碼
   - 粘貼到 Google Apps Script 編輯器
   - 按 Ctrl+S 保存

3. **部署為 Web App**
   - 點擊「部署」按鈕
   - 選擇「新增部署」
   - 類型選擇：Web App
   - 執行身分：選擇您的帳戶
   - 允許誰存取：「任何人」
   - 點擊「部署」
   - **記下部署 ID** (形式為 AKfycby...)

4. **獲得 Web App URL**
   ```
   https://script.google.com/macros/d/{YOUR_DEPLOYMENT_ID}/userweb
   ```

---

### 第 3 步：配置前端代碼

1. **打開 index.html**
   
2. **更新配置**
   在 JavaScript 配置部分找到並替換：
   
   ```javascript
   // 第 37-39 行
   const GAS_SCRIPT_URL = 'https://script.google.com/macros/d/{YOUR_DEPLOYMENT_ID}/userweb';
   const CLIENT_ID = '{YOUR_CLIENT_ID}.apps.googleusercontent.com';
   const API_KEY = '{YOUR_API_KEY}';
   ```

   替換為：
   - `{YOUR_DEPLOYMENT_ID}` → 部署 ID
   - `{YOUR_CLIENT_ID}` → OAuth Client ID
   - `{YOUR_API_KEY}` → Google Drive API Key

3. **保存文件**

---

### 第 4 步：本地測試

1. **打開瀏覽器**
   - 導航到 `file:///C:/Users/Ptivs/Documents/GitHub/dickinatoster.github.io/6/index.html`
   - 或使用本地 Web 服務器

2. **測試功能**
   - ✅ 點擊「登入 Google」
   - ✅ 輸入筆記內容
   - ✅ 按 Ctrl+S 或點擊儲存按鈕
   - ✅ 刷新頁面，確認本地備份仍存在

---

## 🎯 功能詳解

### 💾 儲存機制

| 儲存方式 | 說明 | 用途 |
|---------|------|------|
| **本地存儲** | 瀏覽器 LocalStorage | 即時草稿，瀏覽器關閉後保留 |
| **Google Drive** | 透過 Apps Script | 永久備份，多設備同步 |

### ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| **Ctrl+S** / **Cmd+S** | 快速儲存到 Google Drive |
| **Ctrl+L** | 載入檔案（計劃中） |

### 📊 界面組件

- **狀態指示器**：顯示連接狀態
- **字數計算器**：即時顯示字數
- **最後儲存時間**：追蹤儲存歷史
- **自動保存提示**：本地存儲時間戳

---

## 🔧 進階配置

### 自訂資料夾名稱

編輯 `script-template.gs` 第 7 行：
```javascript
const FOLDER_NAME = "我的雲端記事本";  // 自訂資料夾名稱
```

### 支援多種檔案類型

修改 `listUserFiles()` 函數以支援其他格式：
```javascript
// 支援 .txt 和 .md
const files = folder.getFilesByType(MimeType.PLAIN_TEXT);
// 或
const files = DriveApp.getFiles();
```

### 增加檔案版本控制

可在 Apps Script 中啟用版本歷史：
```javascript
// 在 saveFile() 中添加
file.setContent(content);
DriveApp.getFileById(fileId).makeCopy(`${filename}_backup_${timestamp}`);
```

---

## 🐛 故障排除

### 問題 1：登入不成功
**解決方案：**
- 確認 Client ID 和 API Key 正確
- 檢查 OAuth 重定向 URI 配置
- 清除瀏覽器 Cookie 和快取

### 問題 2：無法儲存到 Google Drive
**解決方案：**
- 確認部署 ID 正確
- 檢查 Apps Script 執行身分
- 確認 Google Drive API 已啟用

### 問題 3：頁面加載緩慢
**解決方案：**
- 檢查網路連接
- 使用瀏覽器開發者工具檢查控制台
- 檢查 Apps Script 配額使用情況

### 問題 4：本地存儲數據丟失
**解決方案：**
- 檢查瀏覽器 LocalStorage 是否啟用
- 確認沒有使用隱私瀏覽模式
- 檢查瀏覽器存儲配額

---

## 📝 使用提示

### ✨ 最佳實踐

1. **定期備份**
   - 使用 Ctrl+S 定期儲存
   - 系統自動備份到本地

2. **檔案命名**
   - 避免特殊字符
   - 使用清晰的描述性名稱
   - 例如：`2024-5月計劃`、`工作日誌`

3. **隱私安全**
   - 在公共電腦上使用後點擊登出
   - 定期檢查 Google 帳號活動
   - 不要在不信任的網絡上使用

### 🎨 自訂主題

編輯 CSS 變數修改顏色主題：
```css
--primary-color: #667eea;
--secondary-color: #764ba2;
--text-color: #333;
```

---

## 📚 API 文檔

### GET 請求

**列出檔案**
```
GET {GAS_SCRIPT_URL}?action=listFiles
```

**獲取檔案內容**
```
GET {GAS_SCRIPT_URL}?action=getFile&fileId={FILE_ID}
```

**獲取用戶信息**
```
GET {GAS_SCRIPT_URL}?action=getUserInfo
```

### POST 請求

**儲存檔案**
```
POST {GAS_SCRIPT_URL}?action=saveFile
Body: {"filename": "筆記名稱", "content": "筆記內容"}
```

**建立檔案**
```
POST {GAS_SCRIPT_URL}?action=createFile
Body: {"filename": "新檔案名稱"}
```

**刪除檔案**
```
POST {GAS_SCRIPT_URL}?action=deleteFile
Body: {"fileId": "{FILE_ID}"}
```

---

## 📦 檔案結構

```
6/
├── index.html              # 前端應用
├── script-template.gs      # Google Apps Script 後端
└── README.md              # 此文件
```

---

## 🔐 安全性注意事項

1. **API Key 管理**
   - 不要將 API Key 提交到公開倉庫
   - 使用環境變數管理敏感信息

2. **OAuth 權限**
   - 只請求必要的權限
   - 定期檢查授權應用

3. **資料傳輸**
   - 始終使用 HTTPS
   - 不要在 URL 中傳遞敏感信息

---

## 🔄 後續開發計畫

- [ ] 多使用者協作編輯
- [ ] 版本歷史和還原
- [ ] Markdown 預覽
- [ ] 全文搜尋功能
- [ ] 標籤和分類系統
- [ ] 導出為 PDF
- [ ] 離線編輯模式
- [ ] 語音備忘錄集成
- [ ] AI 自動摘要
- [ ] 即時同步

---

## 📞 支持

有問題或建議？

1. 檢查 [Google Apps Script 文檔](https://developers.google.com/apps-script)
2. 查看 [Google Drive API 文檔](https://developers.google.com/drive)
3. 在 Google Apps Script 編輯器中運行測試函數

---

## 📄 授權

此項目為教育和個人使用而建立。

---

## 🎉 完成！

恭喜！您已成功設置雲端記事本。開始記錄您的想法和計劃吧！

祝您使用愉快！ 📝✨
