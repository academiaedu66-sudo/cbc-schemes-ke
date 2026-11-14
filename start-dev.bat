@echo off
cd /d "%~dp0"
echo Starting CBC Kenya Resource Hub on http://localhost:3000 ...
call npm.cmd run dev
pause
