# 📦 Install MCP Servers for SoulFriend Project
# This script installs all necessary MCP servers

Write-Host "📦 Installing MCP Servers for SoulFriend Project" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Installing MCP servers globally..." -ForegroundColor Yellow

# Install core MCP servers
Write-Host "Installing filesystem server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-filesystem

Write-Host "Installing git server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-git

Write-Host "Installing SQLite server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-sqlite

Write-Host "Installing Brave search server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-brave-search

Write-Host "Installing PostgreSQL server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-postgres

Write-Host "Installing MongoDB server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-mongodb

Write-Host "Installing Docker server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-docker

Write-Host "Installing Kubernetes server..." -ForegroundColor Cyan
npm install -g @modelcontextprotocol/server-kubernetes

Write-Host ""

Write-Host "🔧 Installing development tools..." -ForegroundColor Yellow

# Install development tools
Write-Host "Installing TypeScript tools..." -ForegroundColor Cyan
npm install -g typescript @types/node ts-node

Write-Host "Installing linting tools..." -ForegroundColor Cyan
npm install -g eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

Write-Host "Installing testing tools..." -ForegroundColor Cyan
npm install -g jest @types/jest ts-jest

Write-Host "Installing build tools..." -ForegroundColor Cyan
npm install -g webpack webpack-cli webpack-dev-server

Write-Host "Installing database tools..." -ForegroundColor Cyan
npm install -g mongodb-tools postgresql-client

Write-Host ""

Write-Host "🔧 Installing VS Code extensions..." -ForegroundColor Yellow

# Install VS Code extensions
Write-Host "Installing TypeScript extensions..." -ForegroundColor Cyan
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint

Write-Host "Installing React extensions..." -ForegroundColor Cyan
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension formulahendry.auto-rename-tag
code --install-extension ms-vscode.vscode-json

Write-Host "Installing Git extensions..." -ForegroundColor Cyan
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph

Write-Host "Installing database extensions..." -ForegroundColor Cyan
code --install-extension mongodb.mongodb-vscode
code --install-extension ms-mssql.mssql

Write-Host ""

Write-Host "✅ MCP servers and tools installed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Installed servers:" -ForegroundColor Yellow
Write-Host "- Filesystem server" -ForegroundColor White
Write-Host "- Git server" -ForegroundColor White
Write-Host "- SQLite server" -ForegroundColor White
Write-Host "- Brave search server" -ForegroundColor White
Write-Host "- PostgreSQL server" -ForegroundColor White
Write-Host "- MongoDB server" -ForegroundColor White
Write-Host "- Docker server" -ForegroundColor White
Write-Host "- Kubernetes server" -ForegroundColor White
Write-Host ""
Write-Host "📋 Installed development tools:" -ForegroundColor Yellow
Write-Host "- TypeScript & Node.js tools" -ForegroundColor White
Write-Host "- ESLint & Prettier" -ForegroundColor White
Write-Host "- Jest testing framework" -ForegroundColor White
Write-Host "- Webpack build tools" -ForegroundColor White
Write-Host "- Database tools" -ForegroundColor White
Write-Host ""
Write-Host "📋 Installed VS Code extensions:" -ForegroundColor Yellow
Write-Host "- TypeScript & React extensions" -ForegroundColor White
Write-Host "- Git & database extensions" -ForegroundColor White
Write-Host "- Code formatting & linting" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart VS Code/Cursor" -ForegroundColor White
Write-Host "2. Run .\auto-fix-errors.ps1 to fix all errors" -ForegroundColor White
Write-Host "3. Configure MCP servers in your IDE" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

