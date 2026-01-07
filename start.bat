@echo off
REM Rate AI - Windows 一键启动脚本
REM 同时启动前端和后端服务器

chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Rate AI - 启动服务器
echo ========================================
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Python，请先安装 Python
    pause
    exit /b 1
)

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查并安装 Python 依赖
echo [1/5] 检查 Python 依赖...
if not exist "venv\Scripts\activate.bat" (
    echo 创建虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate.bat

if not exist "requirements_installed.flag" (
    echo 安装 Python 依赖...
    pip install -q -r requirements.txt
    type nul > requirements_installed.flag
)

REM 检查并运行数据库迁移
echo [2/5] 检查数据库迁移...
python manage.py migrate --noinput

REM 检查并安装 Node 依赖
echo [3/5] 检查 Node.js 依赖...
if not exist "node_modules" (
    echo 安装 Node.js 依赖...
    call npm install
)

REM 启动后端服务器
echo [4/5] 启动后端服务器...
start "Rate AI Backend" /min python manage.py runserver 0.0.0.0:5009

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端服务器
echo [5/5] 启动前端服务器...
start "Rate AI Frontend" /min npm run dev

REM 等待前端启动
timeout /t 3 /nobreak >nul

REM 显示启动信息
echo.
echo ========================================
echo   ✓ 服务器启动成功！
echo ========================================
echo.
echo 后端服务器: http://127.0.0.1:5009
echo 前端服务器: http://localhost:5173
echo API 文档:   http://127.0.0.1:5009
echo 管理界面:   http://127.0.0.1:5009/admin
echo.
echo 服务器已在后台运行
echo 关闭窗口不会停止服务器
echo 要停止服务器，请关闭对应的命令行窗口
echo.
pause

