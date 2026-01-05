#!/bin/bash
# 激活虚拟环境并安装依赖
cd "$(dirname "$0")"
source .venv/bin/activate
pip install -r requirements.txt

