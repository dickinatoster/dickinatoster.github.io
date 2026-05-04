# Dick in a Toaster — 作品集

這個資料庫包含多個網頁範例，其中 `5/` 資料夾為一個使用 ntfy.sh 做即時通知與聊天介面的單頁應用（Single Page Chat）。

主要亮點

- 聊天頁面（`5/index.html`）：使用原生 HTML/CSS/JS，整合 ntfy.sh（HTTPS）來發送與訂閱通知。預設 server 為 `https://ntfy.sh`，topic 為 `drher`。
- 可從瀏覽器直接開啟 `5/index.html` 測試：連線 / 訂閱、發送訊息、即時接收。
- 附帶 PowerShell 腳本 `scripts/send-ntfy.ps1`，可從命令列或 VS Code 任務發送通知。

如何查看範例

1. 打開 `portfolio.html`（作品集頁）或直接開啟 `5/index.html`。
2. 若要從命令列發送通知，請參考 `scripts/send-ntfy.ps1`。

授權與聯絡

- 專案為個人作品集展示，如需使用或修改請與我聯絡。
