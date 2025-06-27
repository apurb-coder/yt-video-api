# deploy.ps1 - Run from backend directory

Write-Host "🔍 Checking for Python..."
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue

if (-not $pythonCheck) {
    Write-Host "❌ Python not found. Downloading and installing..."
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe" -OutFile "python-installer.exe"
    Start-Process -FilePath "python-installer.exe" -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
    Remove-Item "python-installer.exe"
} else {
    Write-Host "✅ Python is already installed"
}

Write-Host "`n🔍 Checking for yt-dlp..."
$ytCheck = Get-Command yt-dlp -ErrorAction SilentlyContinue

if (-not $ytCheck) {
    Write-Host "📦 Installing yt-dlp via pip..."
    python -m pip install --upgrade yt-dlp
} else {
    Write-Host "✅ yt-dlp is already installed"
}

Write-Host "`n📁 Installing Node.js dependencies with yarn..."
yarn install

Write-Host "`n🚀 Deployment complete!"
