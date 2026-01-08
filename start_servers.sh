#!/bin/bash

# 检查并安装Node依赖
if [ ! -d "node_modules" ]; then
    npm install
fi

# 启动Django后端服务器（端口5009）
python3 manage.py runserver 0.0.0.0:5009 > backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动Vite前端服务器（端口5008）
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "后端: http://127.0.0.1:5009 (PID: $BACKEND_PID)"
echo "前端: http://localhost:5008 (PID: $FRONTEND_PID)"
echo "停止: kill $BACKEND_PID $FRONTEND_PID"

