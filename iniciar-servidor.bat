@echo off
chcp 65001 >nul
echo ========================================
echo   Servidor Local para En Linea Spa
echo ========================================
echo.
echo Buscando servidor disponible...
echo.

REM Intentar con Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] Python encontrado
    echo.
    echo Iniciando servidor en http://localhost:8000
    echo.
    echo Presiona Ctrl+C para detener el servidor
    echo.
    python -m http.server 8000
    goto :end
)

REM Intentar con Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] Node.js encontrado
    echo.
    echo Instalando http-server...
    call npm install -g http-server >nul 2>&1
    echo.
    echo Iniciando servidor en http://localhost:8000
    echo.
    echo Presiona Ctrl+C para detener el servidor
    echo.
    http-server -p 8000
    goto :end
)

REM Si no hay Python ni Node.js
echo [✗] No se encontró Python ni Node.js
echo.
echo OPCIONES:
echo.
echo 1. Instalar Python desde: https://www.python.org/downloads/
echo    Luego ejecuta: python -m http.server 8000
echo.
echo 2. Usar Live Server en VS Code:
echo    - Instala la extensión "Live Server"
echo    - Clic derecho en index.html > "Open with Live Server"
echo.
echo 3. Usar XAMPP:
echo    - Instala XAMPP desde: https://www.apachefriends.org/
echo    - Copia la carpeta a C:\xampp\htdocs\
echo    - Abre: http://localhost/enlineaspa
echo.
pause

:end

