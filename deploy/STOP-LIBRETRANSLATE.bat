@echo off
echo.
echo Arrêt de LibreTranslate...
docker compose -f "%~dp0docker-compose.libretranslate.yml" down
echo.
echo LibreTranslate arrêté.
pause
