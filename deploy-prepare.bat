@echo off
echo 🚀 Preparing Dial-Craft CRM for Coolify Deployment...

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

echo 📁 Current directory: %CD%

REM Add all new deployment files
echo 📝 Adding deployment files...
git add docker-compose.yml
git add backend/Dockerfile
git add backend/.dockerignore
git add backend/.env.production.example
git add frontend/Dockerfile
git add frontend/.dockerignore
git add frontend/nginx.conf
git add COOLIFY-DEPLOYMENT.md

REM Check git status
echo 📊 Git Status:
git status --porcelain

REM Commit the changes
echo 💾 Committing deployment configuration...
git commit -m "feat: Add Coolify deployment configuration - Add Docker Compose setup for multi-service deployment - Configure production-ready Dockerfiles for backend and frontend - Add Nginx configuration for frontend with API proxy - Update CORS settings for production domains - Add health checks and security improvements - Include comprehensive deployment documentation Ready for Coolify deployment! 🚀"

REM Push to GitHub
echo 🌐 Pushing to GitHub...
git push origin main

echo ✅ Deployment preparation complete!
echo.
echo Next steps:
echo 1. Go to your Coolify dashboard
echo 2. Add the environment variables from COOLIFY-DEPLOYMENT.md
echo 3. Click Deploy!
echo.
echo 🎯 Your app will be available at your configured domain
echo 📚 API docs will be at: https://your-domain.com/api/docs

pause