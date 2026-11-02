@echo off
chcp 65001 >nul
title Khởi Động LunanD
echo ========================================================
echo   Đang khởi động Ứng dụng Phát Triển Bản Thân & Chi Tiêu
echo ========================================================

set "APP_PATH=%~dp0index.html"
set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if exist "%EDGE_PATH%" (
    start "" "%EDGE_PATH%" --app="%APP_PATH%"
) else (
    start "" "%APP_PATH%"
)

exit

