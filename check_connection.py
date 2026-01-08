#!/usr/bin/env python3
"""
检查前后端连接状态的诊断脚本
"""
import requests
import sys
import socket

def check_port(host, port):
    """检查端口是否开放"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0

def check_backend():
    """检查后端服务"""
    print("=" * 50)
    print("检查后端服务 (http://127.0.0.1:5009)")
    print("=" * 50)
    
    # 检查端口
    if check_port('127.0.0.1', 5009):
        print("✓ 端口 5009 已开放")
    else:
        print("✗ 端口 5009 未开放 - 后端可能未运行")
        print("  请运行: python3 manage.py runserver")
        return False
    
    # 检查API端点
    try:
        response = requests.get('http://127.0.0.1:5009/api/ais/', timeout=2)
        if response.status_code == 200:
            print("✓ API端点可访问")
            print(f"  响应状态: {response.status_code}")
            return True
        else:
            print(f"✗ API端点返回错误状态: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ 无法连接到后端API")
        return False
    except requests.exceptions.Timeout:
        print("✗ 连接超时")
        return False
    except Exception as e:
        print(f"✗ 错误: {e}")
        return False

def check_frontend():
    """检查前端服务"""
    print("\n" + "=" * 50)
    print("检查前端服务 (http://localhost:5009)")
    print("=" * 50)
    
    # 检查端口
    if check_port('127.0.0.1', 5009):
        print("✓ 端口 5009 已开放")
    else:
        print("✗ 端口 5009 未开放 - 前端可能未运行")
        print("  请运行: npm run dev")
        return False
    
    # 检查前端页面
    try:
        response = requests.get('http://localhost:5009/', timeout=2)
        if response.status_code == 200:
            print("✓ 前端页面可访问")
            print(f"  响应状态: {response.status_code}")
            return True
        else:
            print(f"✗ 前端页面返回错误状态: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ 无法连接到前端页面")
        return False
    except requests.exceptions.Timeout:
        print("✗ 连接超时")
        return False
    except Exception as e:
        print(f"✗ 错误: {e}")
        return False

def check_cors():
    """检查CORS配置"""
    print("\n" + "=" * 50)
    print("检查CORS配置")
    print("=" * 50)
    
    try:
        # 发送OPTIONS请求检查CORS
        response = requests.options(
            'http://127.0.0.1:5009/api/ais/',
            headers={
                'Origin': 'http://localhost:5009',
                'Access-Control-Request-Method': 'GET'
            },
            timeout=2
        )
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        }
        
        if cors_headers['Access-Control-Allow-Origin']:
            print("✓ CORS配置正确")
            print(f"  允许的源: {cors_headers['Access-Control-Allow-Origin']}")
            print(f"  允许凭证: {cors_headers['Access-Control-Allow-Credentials']}")
            return True
        else:
            print("✗ CORS配置可能有问题")
            return False
    except Exception as e:
        print(f"✗ 无法检查CORS: {e}")
        return False

if __name__ == '__main__':
    print("\n前后端连接诊断工具\n")
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    cors_ok = check_cors()
    
    print("\n" + "=" * 50)
    print("诊断结果")
    print("=" * 50)
    
    if backend_ok and frontend_ok and cors_ok:
        print("✓ 所有检查通过！前后端应该可以正常连接。")
        sys.exit(0)
    else:
        print("✗ 发现问题，请根据上述提示进行修复。")
        print("\n建议:")
        if not backend_ok:
            print("  1. 确保后端服务正在运行: python3 manage.py runserver")
        if not frontend_ok:
            print("  2. 确保前端服务正在运行: npm run dev")
        if not cors_ok:
            print("  3. 检查 config/settings.py 中的 CORS 配置")
        sys.exit(1)

