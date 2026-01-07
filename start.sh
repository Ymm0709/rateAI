#!/bin/bash

# Rate AI - 一键启动脚本
# 同时启动前端和后端服务器

set -e  # 遇到错误立即退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Rate AI - 启动服务器${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 Python 3.9 是否安装
PYTHON_CMD="python3.9"
if ! command -v python3.9 &> /dev/null; then
    echo -e "${RED}错误: 未找到 python3.9，请先安装 Python 3.9${NC}"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 node，请先安装 Node.js${NC}"
    exit 1
fi

# 检查并安装 Python 依赖
echo -e "${YELLOW}[1/5] 检查 Python 依赖...${NC}"
# 始终使用 python3.9
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo -e "${GREEN}使用虚拟环境（Python 3.9）${NC}"
else
    echo -e "${YELLOW}使用系统 Python 3.9${NC}"
fi

# 检查是否需要安装依赖（检查所有必需的包）
MISSING_DEPS=false
if ! $PYTHON_CMD -c "import django" 2>/dev/null; then
    MISSING_DEPS=true
fi
if ! $PYTHON_CMD -c "import rest_framework" 2>/dev/null; then
    MISSING_DEPS=true
fi
if ! $PYTHON_CMD -c "import corsheaders" 2>/dev/null; then
    MISSING_DEPS=true
fi

if [ "$MISSING_DEPS" = true ]; then
    echo -e "${YELLOW}安装 Python 依赖...${NC}"
    $PYTHON_CMD -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: 依赖安装失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}依赖安装完成${NC}"
fi

# 检查并运行数据库迁移
echo -e "${YELLOW}[2/5] 检查数据库迁移...${NC}"
$PYTHON_CMD manage.py migrate --noinput 2>/dev/null || echo -e "${YELLOW}迁移已完成或跳过${NC}"

# 检查并安装 Node 依赖
echo -e "${YELLOW}[3/5] 检查 Node.js 依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装 Node.js 依赖...${NC}"
    npm install
fi

# 清理函数：退出时停止所有后台进程
cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务器...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # 等待进程结束
    wait $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}服务器已停止${NC}"
    exit 0
}

# 注册清理函数，在脚本退出时执行
trap cleanup SIGINT SIGTERM EXIT

# 启动后端服务器
echo -e "${YELLOW}[4/5] 启动后端服务器...${NC}"
$PYTHON_CMD manage.py runserver 0.0.0.0:8000 > backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否成功启动
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}错误: 后端服务器启动失败，请查看 backend.log${NC}"
    exit 1
fi

# 启动前端服务器
echo -e "${YELLOW}[5/5] 启动前端服务器...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
sleep 3

# 检查前端是否成功启动
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}错误: 前端服务器启动失败，请查看 frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 显示启动信息
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ 服务器启动成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}后端服务器:${NC} http://127.0.0.1:8000"
echo -e "${BLUE}前端服务器:${NC} http://localhost:5173"
echo -e "${BLUE}API 文档:${NC}   http://127.0.0.1:8000"
echo -e "${BLUE}管理界面:${NC}   http://127.0.0.1:8000/admin"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务器${NC}"
echo ""

# 实时显示日志（可选）
if [ "$1" == "--logs" ]; then
    echo -e "${YELLOW}显示实时日志...${NC}"
    tail -f backend.log frontend.log
else
    # 保持脚本运行，等待用户中断
    wait
fi

