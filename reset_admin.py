#!/usr/bin/env python
"""
重置Django Admin管理员密码或创建新的管理员账号
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

def reset_admin():
    """重置管理员密码或创建新的管理员"""
    print("=" * 60)
    print("Django Admin 管理员账号管理工具")
    print("=" * 60)
    print()
    
    # 查找现有的超级用户
    superusers = User.objects.filter(is_superuser=True)
    
    if superusers.exists():
        print(f"找到 {superusers.count()} 个超级用户:")
        for i, user in enumerate(superusers, 1):
            print(f"  {i}. 用户名: {user.username}, 邮箱: {user.email}")
        print()
        
        choice = input("选择操作:\n  1. 重置现有超级用户密码\n  2. 创建新的超级用户\n请输入选项 (1/2): ").strip()
        
        if choice == '1':
            if superusers.count() == 1:
                user = superusers.first()
            else:
                user_id = input("请输入要重置的用户名: ").strip()
                try:
                    user = superusers.get(username=user_id)
                except User.DoesNotExist:
                    print(f"错误: 找不到用户名为 '{user_id}' 的超级用户")
                    return
            
            new_password = input("请输入新密码: ").strip()
            if not new_password:
                print("错误: 密码不能为空")
                return
            
            user.password_hash = make_password(new_password)
            user.save()
            print(f"\n✅ 成功重置用户 '{user.username}' 的密码!")
            print(f"   用户名: {user.username}")
            print(f"   新密码: {new_password}")
            
        elif choice == '2':
            create_new_superuser()
        else:
            print("无效的选项")
    else:
        print("未找到现有的超级用户")
        choice = input("是否创建新的超级用户? (y/n): ").strip().lower()
        if choice == 'y':
            create_new_superuser()
        else:
            print("取消操作")


def create_new_superuser():
    """创建新的超级用户"""
    print("\n创建新的超级用户:")
    username = input("请输入用户名: ").strip()
    if not username:
        print("错误: 用户名不能为空")
        return
    
    # 检查用户名是否已存在
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        choice = input(f"用户名 '{username}' 已存在，是否将其设置为超级用户? (y/n): ").strip().lower()
        if choice == 'y':
            user.is_superuser = True
            user.is_staff = True
            password = input("请输入新密码: ").strip()
            if not password:
                print("错误: 密码不能为空")
                return
            user.password_hash = make_password(password)
            user.save()
            print(f"\n✅ 成功将用户 '{username}' 设置为超级用户!")
            print(f"   用户名: {username}")
            print(f"   密码: {password}")
            return
        else:
            return
    
    email = input("请输入邮箱 (可选): ").strip()
    if not email:
        email = f"{username}@example.com"
    
    password = input("请输入密码: ").strip()
    if not password:
        print("错误: 密码不能为空")
        return
    
    # 创建新用户
    user = User.objects.create(
        username=username,
        email=email,
        password_hash=make_password(password),
        is_superuser=True,
        is_staff=True,
        is_active=True,
        is_approved=True  # 超级用户自动批准
    )
    
    print(f"\n✅ 成功创建超级用户!")
    print(f"   用户名: {user.username}")
    print(f"   邮箱: {user.email}")
    print(f"   密码: {password}")
    print(f"\n现在可以使用以下信息登录 Django Admin:")
    print(f"   访问地址: http://127.0.0.1:5009/admin/")
    print(f"   用户名: {user.username}")
    print(f"   密码: {password}")


if __name__ == '__main__':
    try:
        reset_admin()
    except KeyboardInterrupt:
        print("\n\n操作已取消")
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()

