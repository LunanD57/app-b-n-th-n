@echo off
chcp 65001 >nul
echo Đang tạo phím tắt trên Desktop...

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'LunanD.lnk')); $Shortcut.TargetPath = '\"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe\"'; $Shortcut.Arguments = '--app=\"\"\"%~dp0index.html\"\"\"'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Ứng dụng Phát Triển Bản Thân & Quản Lý Chi Tiêu'; $Shortcut.Save()"

echo ========================================================
echo   ĐÃ TẠO PHÍM TẮT THÀNH CÔNG NGOÀI MÀN HÌNH CHÍNH (DESKTOP)!
echo ========================================================
pause

