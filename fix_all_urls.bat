@echo off
REM URL Modernization Script for Windows
REM Fixes ALL dot-notation URLs in the entire project

echo ========================================
echo URL Modernization Script
echo ========================================
echo.
echo This script will:
echo   1. Find all .pug files in views/
echo   2. Replace dot-notation URLs with slash-based URLs
echo   3. Create a backup before making changes
echo.
pause

REM Create backup
echo.
echo Creating backup...
set BACKUP_DIR=url_fix_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%" 2>nul
xcopy /E /I /Y views "%BACKUP_DIR%\views\" >nul
echo Backup created in: %BACKUP_DIR%
echo.

echo Fixing URLs in .pug files...
echo.

REM Use PowerShell to do the replacements
powershell -Command "$files = Get-ChildItem -Path views -Recurse -Filter *.pug; $count = 0; foreach ($file in $files) { $content = Get-Content $file.FullName -Raw; $newContent = $content -replace '/school\.students\.list', '/school/students/list' -replace '/school\.students\.json', '/school/students/list' -replace '/school\.student\.edit', '/school/student/edit' -replace '/school\.student\.delete', '/school/student/delete' -replace '/school\.content\.list/', '/school/data/' -replace '/school\.teachers\.list/', '/school/teachers/' -replace '/school\.courseAndProgram\.list/', '/school/courses-programs/' -replace '/option\.list/', '/school/options/' -replace '/option\.set/', '/school/option/set/' -replace '/set\.class\.teacher', '/school/class/teacher/set' -replace '/classe\.list\.confirm/', '/classe/list/confirm/' -replace '/classe\.list', '/classe/list' -replace '/classe\.edit', '/classe/edit' -replace '/classe\.delete', '/classe/delete' -replace '/class\.add', '/classe/add' -replace '/dashboard\.accounts\.validation', '/dashboard/accounts/validation' -replace '/dashboard\.accounts\.tovalidate', '/dashboard/accounts/tovalidate' -replace '/dashboard\.validate\.student', '/dashboard/validate/student' -replace '/dashboard\.validate\.teacher', '/dashboard/validate/teacher' -replace '/dashboard\.class\.signup/', '/dashboard/class/signup/' -replace '/dashboard\.register\.course/', '/dashboard/register/course/' -replace '/student\.set_paid', '/student/set_paid' -replace '/classe\.get\.nexts/', '/classe/get/nexts/' -replace '/classe\.get\.repeat/', '/classe/get/repeat/' -replace '/classe\.get\.courses/', '/classe/get/courses/'; if ($content -ne $newContent) { Set-Content -Path $file.FullName -Value $newContent; Write-Host ('  ' + [char]0x2713 + ' Fixed: ' + $file.FullName); $count++ } } Write-Host ''; Write-Host ('Total files updated: ' + $count)"

echo.
echo ========================================
echo URL Modernization Complete!
echo ========================================
echo.
echo Important Next Steps:
echo   1. Restart your Node.js server
echo   2. Clear browser cache (Ctrl+Shift+R)
echo   3. Test the application
echo.
echo If something breaks, restore from backup:
echo   xcopy /E /I /Y %BACKUP_DIR%\views\* views\
echo.
pause
