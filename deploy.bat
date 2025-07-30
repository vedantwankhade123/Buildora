@echo off
echo 🚀 Deploying Dezi-Agent to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI is not installed. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Not logged in to Vercel. Please login first:
    vercel login
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Generate Prisma client
echo 🗄️ Generating Prisma client...
npx prisma generate

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo 📝 Don't forget to:
echo    1. Set up environment variables in Vercel dashboard
echo    2. Run database migrations: npx prisma migrate deploy
echo    3. Test your deployed application
pause 