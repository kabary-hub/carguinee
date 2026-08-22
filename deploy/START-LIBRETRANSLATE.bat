@echo off
echo.
echo ════════════════════════════════════════════════════════
echo   LibreTranslate — Instance auto-hebergee pour CarGuinee
echo ════════════════════════════════════════════════════════
echo.
echo Demarrage du container Docker...
echo (Premier lancement : 5-10 min pour telecharger les modeles)
echo.

docker compose -f "%~dp0docker-compose.libretranslate.yml" up -d

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERREUR] Docker n'est pas demarre ou docker compose n'est pas installe.
    echo Installez Docker Desktop : https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo.
echo En attente du demarrage...
echo (Le healthcheck prend quelques secondes)
echo.

:WAIT_LOOP
curl -s http://localhost:5000/languages >nul 2>&1
if %ERRORLEVEL% neq 0 (
    timeout /t 5 /nobreak >nul
    goto WAIT_LOOP
)

echo.
echo ════════════════════════════════════════════════════════
echo   LibreTranslate est pret sur http://localhost:5000
echo ════════════════════════════════════════════════════════
echo.
echo   Langues chargees : Francais, Anglais
echo   Pas de cle API requise.
echo.
pause
