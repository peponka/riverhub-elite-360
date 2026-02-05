@echo off
echo INICIANDO SISTEMA RIVERHUB...
echo --------------------------------
echo 1. Iniciando Servidor Unificado (Puerto 3000)...
start "RIVERHUB SERVER" cmd /c "node app.js & pause"

echo --------------------------------
echo SISTEMA INICIADO CORRECTAMENTE.
echo NO CIERRES LAS DOS VENTANAS NEGRAS QUE SE ABRIERON.
echo SI LAS CIERRAS, EL MAPA DEJARA DE FUNCIONAR.
echo --------------------------------
timeout /t 5
exit
