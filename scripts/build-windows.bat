@echo off
setlocal

cd /d "%~dp0.."

echo ==================================================
echo Build Windows - Instalador (NSIS) + Portatil
echo ==================================================
echo.

if exist "dist" (
  rmdir /s /q "dist"
)

if exist "release" (
  rmdir /s /q "release"
)

echo [1/2] Gerando build do frontend...
call npm run build
if errorlevel 1 (
  echo.
  echo Erro ao executar "npm run build".
  exit /b 1
)

echo.
echo [2/2] Gerando instalador e portatil para Windows...
call npx electron-builder --win nsis portable
if errorlevel 1 (
  echo.
  echo Erro ao executar electron-builder.
  exit /b 1
)

echo.
echo Build finalizado com sucesso.
echo Arquivos gerados em: release\
endlocal
