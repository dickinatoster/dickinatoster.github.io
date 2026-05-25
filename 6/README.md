# ☁️ 雲端記事本 - 正式服務版

## 📋 方案概述

此版本以 Google Drive API + OAuth 2.0 為核心，適合正式服務與長期維護。前端不直接依賴 GAS，而是透過使用者登入 Google 後取得授權，直接讀寫指定的 Google Drive 資料夾。

### 核心特性

- 🔐 使用 OAuth 2.0 做登入與授權
- 📁 直接存取 Google Drive 資料夾
- 🧾 以使用者權限為基礎的讀寫控制
- 💾 可搭配本地暫存與雲端同步
- 🛡️ 適合正式產品的權限與審計需求

---

## 🧭 運作邏輯

1. 使用者在網站點擊「登入 Google」
2. Google 驗證後回傳授權權杖
3. 前端或後端使用 access token 呼叫 Google Drive API
4. 系統讀取或更新指定資料夾中的檔案
5. 必要時透過 refresh token 維持登入狀態

---

## 🚀 建置步驟

### 第 1 步：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 新增一個專案，例如 CloudNotepad
3. 啟用 Google Drive API
4. 設定 OAuth 同意畫面

### 第 2 步：建立 OAuth 2.0 憑證

1. 進入「憑證」頁面
2. 建立 OAuth 2.0 用戶端 ID
3. 應用類型選擇「網頁應用程式」
4. 新增授權重新導向 URI
5. 記下 Client ID 與 Client Secret

### 第 3 步：整合前端與 API

1. 在網站加入 Google 登入流程
2. 取得使用者授權後呼叫 Drive API
3. 依需求實作資料夾讀取、建立、更新與刪除
4. 將關鍵設定改成環境變數或安全設定

---

## 🧩 建議架構

| 元件 | 職責 |
|------|------|
| 前端網站 | 提供登入、瀏覽與編輯介面 |
| OAuth 2.0 | 管理使用者授權與 token |
| Google Drive API | 實際讀寫雲端資料夾 |
| 後端服務 | 保護敏感設定、處理 token 更新與商業邏輯 |

---

## 📌 實作重點

- 若要做正式服務，建議把 token 交換與 refresh token 管理放在後端
- 前端只保留登入按鈕、檔案清單與編輯介面
- 讀寫 Drive 時要限制在指定資料夾或指定 app 資料範圍內
- 上線前要確認 Google OAuth 驗證狀態與使用者同意畫面設定

---

## 🐛 常見問題

### 登入失敗

- 檢查 Client ID 是否正確
- 確認重新導向 URI 完全一致
- 確認 OAuth 同意畫面已完成必要設定

### 無法讀寫 Drive

- 確認已啟用 Google Drive API
- 確認授權 scope 足夠
- 檢查 token 是否過期或被撤銷

### 權限不完整

- 檢查應用程式請求的 scope 是否過大或過小
- 確認資料夾分享權限與使用者帳號一致
- 若是正式服務，建議改由後端集中控管敏感操作

---

## ✅ 結論

如果目標是正式服務、長期維護與完整權限控管，這個資料夾應採用 Google Drive API + OAuth 2.0，而不是以 GAS Web App 作為主要架構。

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

正式服務版本不再透過 GAS Web App 暴露自訂 API，而是直接以 Google Drive API 搭配 OAuth 2.0 存取資料。

建議依需求切分以下操作：

- 讀取檔案清單：使用 Drive API 查詢指定資料夾中的檔案
- 讀取檔案內容：根據 fileId 取得檔案資料
- 建立檔案：建立新檔並指定目標資料夾
- 更新檔案：以檔案 ID 更新內容
- 刪除檔案：依權限刪除或移除檔案

實作時應將 token 交換、refresh token 管理與敏感設定保留在後端，前端只負責登入與檔案操作流程。

---

## 📦 檔案結構

```
6/
├── index.html              # 前端應用
├── script-template.gs      # Drive API / OAuth 串接範例
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

1. 查看 [Google Drive API 文檔](https://developers.google.com/drive)
2. 查看 [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
3. 檢查 Google Cloud Console 的 OAuth 設定與授權畫面

---

## 📄 授權

此項目為教育和個人使用而建立。

---

## 🎉 完成！

恭喜！您已成功設置雲端記事本。開始記錄您的想法和計劃吧！

祝您使用愉快！ 📝✨
