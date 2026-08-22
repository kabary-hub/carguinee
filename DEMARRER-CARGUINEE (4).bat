@echo off
setlocal
title CarGuinee - Demarrage
set "ROOT=%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe. Installez la version LTS de Node.js puis relancez ce fichier.
  pause
  exit /b 1
)

if not exist "%ROOT%backend\package.json" (
  echo Le dossier backend est introuvable. Placez ce fichier a la racine du projet CarGuinee.
  pause
  exit /b 1
)

if not exist "%ROOT%backend\.env" (
  copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul
  echo.
  echo Le fichier backend\.env vient d'etre cree.
  echo Ouvrez-le et renseignez DATABASE_URL et JWT_SECRET avant de relancer ce fichier.
  start "Configuration CarGuinee" notepad "%ROOT%backend\.env"
  pause
  exit /b 1
)

if not exist "%ROOT%backend\node_modules" (
  echo Installation des dependances backend...
  call npm --prefix "%ROOT%backend" install
  if errorlevel 1 goto :error
)

if not exist "%ROOT%frontend\node_modules" (
  echo Installation des dependances frontend...
  call npm --prefix "%ROOT%frontend" install
  if errorlevel 1 goto :error
)

echo.
echo Demarrage des deux serveurs CarGuinee...
start "CarGuinee - Backend" /D "%ROOT%backend" cmd.exe /k "npm run dev"
timeout /t 2 /nobreak >nul
start "CarGuinee - Frontend" /D "%ROOT%frontend" cmd.exe /k "npm run dev"
echo.
echo Ouvrez ensuite http://localhost:5173 dans votre navigateur.
pause
exit /b 0

:error
echo L'installation a echoue. Verifiez votre connexion Internet, Node.js et le message affiche ci-dessus.
pause
exit /b 1
