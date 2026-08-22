@echo off
setlocal
title CarGuinee - Synchronisation des 8 photos
set "ROOT=%~dp0"

if not exist "%ROOT%backend\.env" (
  echo Le fichier backend\.env est introuvable.
  echo Copiez le fichier .env de votre ancien projet dans le dossier backend puis relancez ce fichier.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe. Installez Node.js LTS puis relancez ce fichier.
  pause
  exit /b 1
)

if not exist "%ROOT%backend\node_modules" (
  echo Installation des dependances backend...
  call npm --prefix "%ROOT%backend" install
  if errorlevel 1 goto :error
)

echo.
echo Synchronisation des 8 photos pour les 6 voitures de demonstration...
pushd "%ROOT%backend"
call npm run demo:galleries
set "RESULT=%ERRORLEVEL%"
popd

if not "%RESULT%"=="0" goto :error

echo.
echo Terminee. Ouvrez ou actualisez ensuite http://localhost:5173 puis cliquez sur une voiture.
pause
exit /b 0

:error
echo.
echo La synchronisation a echoue. Prenez une capture de cette fenetre et envoyez-la moi.
pause
exit /b 1
