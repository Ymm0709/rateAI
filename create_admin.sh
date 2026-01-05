#!/bin/bash
# 创建Django Admin超级用户
cd "$(dirname "$0")"
echo "创建Django Admin超级用户..."
python3 manage.py createsuperuser

