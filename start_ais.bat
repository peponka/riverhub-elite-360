@echo off
echo Instalando librerias necesarias...
call npm install ws
echo.
echo Iniciando prueba de AISStream...
echo ------------------------------------------
node ais_test.js
echo.
echo ------------------------------------------
pause
