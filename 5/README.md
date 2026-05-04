# 聊天應用（5/index.html）

這是使用 `ntfy.sh` 建構的單頁聊天示範。可以直接在瀏覽器中開啟 `5/index.html` 使用。

主要功能

- Server 與 Topic 輸入（預設 `https://ntfy.sh` / `drher`）
- 點擊「連線 / 訂閱」使用 SSE (`/sse`) 訂閱主題
- 在下方輸入訊息可透過 HTTP POST 發送到 ntfy 創建通知
- 支援中文主題編碼、SSE JSON 或純文字處理
- 使用者顯示名稱：`怡文`

快速測試

1. 開啟 `5/index.html`。
2. 確認 Server = `https://ntfy.sh`、Topic = `drher`。
3. 點「連線 / 訂閱」，頁面會顯示訂閱狀態。
4. 輸入訊息按 Enter 或點「送出」，此訊息會發送到 ntfy，並在頁面顯示。

PowerShell 腳本

- `scripts/send-ntfy.ps1`：用於從命令列或 CI 發送 ntfy 訊息。範例：

  pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\send-ntfy.ps1 -Server "https://ntfy.sh" -Topic "drher" -Title "怡文" -Message "測試通知"

VS Code 任務

- 已在 `.vscode/tasks.json` 中加入互動輸入，可啟動 `send-ntfy.ps1` 並填入參數。

注意事項

- ntfy 主題為公開識別字串，請避免使用可被猜到或含個資的主題名稱。
- 若有自己的 ntfy 伺服器，請填入完整 URL 作為 Server。

