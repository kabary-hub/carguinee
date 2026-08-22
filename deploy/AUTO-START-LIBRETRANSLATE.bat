@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM  Auto-start LibreTranslate after Docker Desktop is ready
REM
REM  Installation :
REM    1. Copier ce fichier dans le dossier de démarrage Windows :
REM       %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
REM    2. Ou créer un raccourci vers ce fichier dans ce dossier.
REM
REM  Ce script :
REM    - Attend que Docker soit complètement prêt (jusqu'à 5 minutes)
REM    - Puis lance LibreTranslate si le container n'est pas déjà en cours
REM ─────────────────────────────────────────────────────────────────────────

setlocal
title Auto-start LibreTranslate

REM ── Chemin vers le dossier du script ──
set "ROOT=%~dp0"
set "COMPOSE_FILE=%ROOT%docker-compose.libretranslate.yml"

REM ── Attendre que Docker soit prêt (max 5 min = 60 tentatives x 5s) ──
set "MAX_ATTEMPTS=60"
set "ATTEMPT=0"

echo [%date% %time%] En attente de Docker Desktop...

:WAIT_DOCKER
set /a ATTEMPT+=1
if %ATTEMPT% gtr %MAX_ATTEMPTS% (
    echo [%date% %time%] ERREUR : Docker n'est pas pret apres 5 minutes.
    echo Verifiez que Docker Desktop est installe et configuré pour demarrer au boot.
    goto :END
)

REM ── Tester si Docker est joignable ──
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    timeout /t 5 /nobreak >nul
    goto :WAIT_DOCKER
)

echo [%date% %time%] Docker est pret !

REM ── Vérifier si LibreTranslate tourne déjà ──
docker ps --filter "name=carguinee-libretranslate" --format "{{.Names}}" | findstr "carguinee-libretranslate" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [%date% %time%] LibreTranslate est deja en cours d'execution.
    goto :END
)

REM ── Démarrer LibreTranslate ──
echo [%date% %time%] Demarrage de LibreTranslate...
docker compose -f "%COMPOSE_FILE%" up -d
if %ERRORLEVEL% neq 0 (
    echo [%date% %time%] ERREUR lors du demarrage de LibreTranslate.
    goto :END
)

echo [%date% %time%] LibreTranslate demarre avec succes.
echo [%date% %time%] Accessible sur http://localhost:5000

:END
endlocal
