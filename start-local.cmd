@echo off
cd /d "%~dp0"
echo Starting Netflix Analysis on http://localhost:4180
echo Keep this window open while using the site.
node server.js
