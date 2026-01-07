#!/usr/bin/env python
"""
快速创建或重置Django Admin管理员账号
用法: python3 create_admin_simple.py <username> <password> [email]
"""
import os
import sys
import django

# 设置Django环境
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.models import User
from django.contrib.auth.hashers import make_password

def create_or_update_admin(username, password, email=None):
    """创建或更新管理员账号"""
    if not username or not password:
        print("错误: 用户名和密码不能为空")
        print("\n用法: python3 create_admin_simple.py <username> <password> [email]")
        sys.exit(1)
    
    # 如果未提供邮箱，使用默认邮箱
    if not email:
        email = f"{username}@example.com"
    
    # 检查用户是否已存在
    try:
        user = User.objects.get(username=username)
        print(f"用户 '{username}' 已存在，正在更新为超级用户...")
        user.password_hash = make_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        user.is_approved = True
        if email:
            user.email = email
        user.save()
        print(f"✅ 成功更新用户 '{username}' 为超级用户!")
    except User.DoesNotExist:
        print(f"创建新的超级用户 '{username}'...")
        # 检查邮箱是否已被使用
        if User.objects.filter(email=email).exists():
            print(f"警告: 邮箱 '{email}' 已被使用，将使用不同的邮箱")
            email = f"{username}_{User.objects.count() + 1}@example.com"
        
        user = User.objects.create(
            username=username,
            email=email,
            password_hash=make_password(password),
            is_superuser=True,
            is_staff=True,
            is_active=True,
            is_approved=True
        )
        print(f"✅ 成功创建超级用户 '{username}'!")
    
    print("\n" + "=" * 60)
    print("管理员账号信息:")
    print("=" * 60)
    print(f"  用户名: {user.username}")
    print(f"  邮箱: {user.email}")
    print(f"  密码: {password}")
    print(f"\n现在可以使用以下信息登录 Django Admin:")
    print(f"  访问地址: http://127.0.0.1:5009/admin/")
    print(f"  用户名: {user.username}")
    print(f"  密码: {password}")
    print("\n审核用户的方法:")
    print("  1. 访问 http://127.0.0.1:5009/admin/")
    print("  2. 登录后点击左侧菜单 '应用用户' (Users)")
    print("  3. 找到待审核的用户，勾选 'is_approved' 复选框")
    print("  4. 点击 '保存' 完成审核")
    print("=" * 60)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("用法: python3 create_admin_simple.py <username> <password> [email]")
        print("\n示例:")
        print("  python3 create_admin_simple.py admin 123456")
        print("  python3 create_admin_simple.py admin 123456 admin@example.com")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    email = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        create_or_update_admin(username, password, email)
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

