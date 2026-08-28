# ==============================================================================
# LearnPath AI — Enterprise Production Deployment Script (PowerShell)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "🚀 [1/5] Validating Environment Configuration..." -ForegroundColor Cyan
npm run validate:env

Write-Host "📦 [2/5] Compiling Frontend & Backend Production Bundles..." -ForegroundColor Cyan
npm run build
npm run build:server

Write-Host "🧪 [3/5] Executing Production Smoke & Regression Tests..." -ForegroundColor Cyan
npm run test:all

Write-Host "🗄️ [4/5] Synchronizing PostgreSQL Database Schema & Seeds..." -ForegroundColor Cyan
npx prisma db push --skip-generate
npm run db:seed

Write-Host "✨ [5/5] Launching High-Performance Production Server..." -ForegroundColor Green
npm run start
