@echo off
rem road 점검 - 두 번 클릭하면 검사 세 가지가 한 번에 돕니다
rem 이 파일은 'BOM 없는 UTF-8' 로 저장해야 합니다 (chcp 65001 과 짝)
chcp 65001 >nul
cd /d "%~dp0"
node "_점검.js" %*
echo.
pause
