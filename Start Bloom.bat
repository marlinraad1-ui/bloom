@echo off
REM Starts Bloom on this PC and opens it in your browser.
cd /d "%~dp0"
start "" http://localhost:8765/index.html
python -m http.server 8765
