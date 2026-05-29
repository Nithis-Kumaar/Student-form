$ErrorActionPreference = "Stop"

$python = "C:/Users/balra/AppData/Local/Microsoft/WindowsApps/python3.12.exe"
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "Installing dependencies..."
& $python -m pip install -r requirements.txt

$port = 8000
$url = "http://127.0.0.1:$port"

Write-Host "Starting FastAPI backend on $url ..."
Start-Process -FilePath $python -ArgumentList "-m uvicorn main:app --reload --host 0.0.0.0 --port $port" -NoNewWindow

Start-Sleep -Seconds 2
Write-Host "Opening browser at $url ..."
Start-Process $url
