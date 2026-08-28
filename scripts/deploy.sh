#!/usr/bin/env bash
# ==============================================================================
# LearnPath AI — Enterprise Production Deployment Script
# ==============================================================================
set -euo pipefail

echo "🚀 [1/5] Validating Environment Configuration..."
npm run validate:env

echo "📦 [2/5] Compiling Frontend & Backend Production Bundles..."
npm run build
npm run build:server

echo "🧪 [3/5] Executing Production Smoke & Regression Tests..."
npm run test:all

echo "🗄️ [4/5] Synchronizing PostgreSQL Database Schema & Seeds..."
npx prisma db push --skip-generate
npm run db:seed

echo "✨ [5/5] Launching High-Performance Production Server..."
npm run start
