# PrepPro Backend Startup Script
Write-Host "🚀 Starting PrepPro Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your MongoDB connection string" -ForegroundColor Yellow
    Write-Host "See env.example for template" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Starting server on port 5000..." -ForegroundColor Green
Write-Host ""
npm run dev

