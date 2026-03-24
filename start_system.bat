@echo off
echo INICIANDO SISTEMA RIVERHUB...
echo --------------------------------
echo 1. Iniciando Servidor Web y Enlace Satelital Unificado (Puerto 3000/4001)...
start "RIVERHUB WEB SERVER" cmd /c "node app.js & pause"

echo --------------------------------
echo SISTEMA INICIADO CORRECTAMENTE.
echo NO CIERRES LA VENTANA NEGRA QUE SE ABRIO.
echo SI LA CIERRAS, EL MAPA DEJARA DE ESTAR EN TIEMPO REAL.
echo --------------------------------
timeout /t 5
exit
