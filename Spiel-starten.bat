@echo off
title Pizzeria Parola - lokaler Server
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js fehlt. Bitte von https://nodejs.org installieren und den PC neu starten.
  echo.
  pause
  exit /b 1
)
echo.
echo Pizzeria Parola startet auf http://localhost:5173
echo Dieses Fenster offen lassen. Zum Beenden einfach schliessen.
echo.
start "" http://localhost:5173
npx --yes serve www -l 5173 --no-clipboard
pause
