# Digital Edge Solutions 404 Page SSH Deployment Script (PowerShell)
# Usage: ./deploy-404-ssh.ps1 username@your-server

param(
    [Parameter(Mandatory=$true)]
    [string]$Server
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting 404 page deployment to $Server" -ForegroundColor Green

# Create temporary deployment directory
$TempDir = "404-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "📁 Preparing files..." -ForegroundColor Yellow

New-Item -ItemType Directory -Name $TempDir
Copy-Item "public/404.html" "$TempDir/"
Copy-Item "backend/src/common/filters/not-found-exception.filter.ts" "$TempDir/"
Copy-Item "backend/src/main.ts" "$TempDir/"
Copy-Item "frontend/nginx.conf" "$TempDir/"

Write-Host "📤 Uploading files to server..." -ForegroundColor Yellow
scp -r $TempDir/ "${Server}:/tmp/"

Write-Host "🔧 Configuring server..." -ForegroundColor Yellow

# SSH commands to execute on server
$SSHCommands = @"
echo "Finding Docker containers..."
BACKEND_CONTAINER=`$(docker ps --format "table {{.Names}}" | grep -i backend | head -1)
FRONTEND_CONTAINER=`$(docker ps --format "table {{.Names}}" | grep -i frontend | head -1)

if [ -z "`$BACKEND_CONTAINER" ]; then
    echo "❌ Backend container not found"
    exit 1
fi

if [ -z "`$FRONTEND_CONTAINER" ]; then
    echo "❌ Frontend container not found"
    exit 1
fi

echo "📦 Found containers:"
echo "  Backend: `$BACKEND_CONTAINER"
echo "  Frontend: `$FRONTEND_CONTAINER"

# Get the temp directory name
TEMP_DIR=`$(ls /tmp/ | grep 404-deployment | head -1)

echo "🔄 Copying files to containers..."

# Copy to backend container
docker cp /tmp/`$TEMP_DIR/404.html `$BACKEND_CONTAINER:/app/public/404.html
docker exec `$BACKEND_CONTAINER mkdir -p /app/src/common/filters
docker cp /tmp/`$TEMP_DIR/not-found-exception.filter.ts `$BACKEND_CONTAINER:/app/src/common/filters/
docker cp /tmp/`$TEMP_DIR/main.ts `$BACKEND_CONTAINER:/app/src/main.ts

# Copy to frontend container  
docker cp /tmp/`$TEMP_DIR/nginx.conf `$FRONTEND_CONTAINER:/etc/nginx/conf.d/default.conf

echo "🔄 Restarting containers..."
docker restart `$BACKEND_CONTAINER
docker restart `$FRONTEND_CONTAINER

echo "🧹 Cleaning up..."
rm -rf /tmp/`$TEMP_DIR

echo "✅ Deployment complete!"
echo "🌐 Test your 404 pages:"
echo "  Web: http://your-domain.com/nonexistent-page"
echo "  API: http://your-domain.com/api/nonexistent-endpoint"
"@

ssh $Server $SSHCommands

# Cleanup local temp directory
Remove-Item -Recurse -Force $TempDir

Write-Host "🎉 404 page deployment completed successfully!" -ForegroundColor Green
Write-Host "💡 Your Digital Edge Solutions 404 page is now active!" -ForegroundColor Cyan