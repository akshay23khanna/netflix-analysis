@echo off
cd /d "%~dp0"
start "Netflix Analysis Server" cmd /k start-local.cmd
timeout /t 2 /nobreak >nul
start http://localhost:4180
