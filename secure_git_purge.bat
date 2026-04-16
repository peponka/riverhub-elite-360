@echo off
echo ====================================================
echo RIVERHUB ELITE 360 - SECURITY PURGE SCRIPT
echo ====================================================
echo.
echo 1. Purgando archivos sensibles del cache de Git (ignora errores si no existian)...
git rm --cached --ignore-unmatch .env
git rm --cached --ignore-unmatch riverhub_mobile\riverhub_mobile_v2\android\app\google-services.json
git rm --cached --ignore-unmatch *.pem
git rm --cached --ignore-unmatch *.key
git rm --cached --ignore-unmatch supabase\config.toml

echo.
echo 2. Agregando reglas estrictas y cambios de auditoria al Stage...
git add .
git status

echo.
echo 3. Creando el Commit Definitivo de Auditoria...
git commit -m "Security Audit Remediation: Strict CSP, CSS Bundling, Flutter Memory Leaks, Auth Rotations, and Network Resiliency"

echo.
echo ====================================================
echo COMMIT SEGURO EXITOSO.
echo ====================================================
echo Si quieres enviar esto a produccion, ejecuta:
echo git push origin main
echo ====================================================
pause
