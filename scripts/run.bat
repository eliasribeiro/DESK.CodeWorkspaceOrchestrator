@echo off
cd /d "%~dp0.."

for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":5173 .*LISTENING"') do (
  taskkill /f /pid %%p >nul 2>&1
)

if exist "node_modules\.vite" (
  rmdir /s /q "node_modules\.vite"
)

if exist ".vite" (
  rmdir /s /q ".vite"
)

if exist "dist" (
  rmdir /s /q "dist"
)

npm run dev
