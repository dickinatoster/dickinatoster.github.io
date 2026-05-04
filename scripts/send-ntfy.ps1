param(
  [Parameter(Mandatory = $true)]
  [string]$Server,

  [Parameter(Mandatory = $true)]
  [string]$Topic,

  [Parameter(Mandatory = $true)]
  [string]$Title,

  [Parameter(Mandatory = $true)]
  [string]$Message,

  [ValidateSet('min','low','default','high','max')]
  [string]$Priority = 'default',

  [string]$Tags = ''
)

$Server = $Server.Trim().TrimEnd('/')
$Topic = $Topic.Trim().Trim('/')
$Title = $Title.Trim()
$Message = $Message.Trim()

if (-not $Server) {
  throw 'Server 不能是空值。'
}

if (-not $Topic) {
  throw 'Topic 不能是空值。'
}

if (-not $Title) {
  throw 'Title 不能是空值。'
}

if (-not $Message) {
  throw 'Message 不能是空值。'
}

$uri = "$Server/$Topic"
$headers = @{
  'X-Title' = $Title
  'X-Priority' = $Priority
}

if ($Tags) {
  $headers['X-Tags'] = ($Tags -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join ','
}

try {
  $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $Message -ContentType 'text/plain; charset=utf-8' -ErrorAction Stop
  Write-Host "已送出到 $uri"
  if ($null -ne $response) {
    $response | Out-String | Write-Host
  }
}
catch {
  throw "發送失敗：$($_.Exception.Message)"
}
