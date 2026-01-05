"""
自定义认证后端，用于支持自定义User模型
"""
from django.contrib.auth.backends import BaseBackend
from rest_framework.authentication import SessionAuthentication
from .models import User


class CustomUserBackend(BaseBackend):
    """
    自定义认证后端，用于Django的认证系统识别我们的自定义User模型
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        认证用户
        """
        if username is None or password is None:
            return None
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return None
        
        # 检查密码
        from django.contrib.auth.hashers import check_password
        if check_password(password, user.password_hash):
            return user
        return None
    
    def get_user(self, user_id):
        """
        根据user_id获取用户对象
        Django会传递pk值（即user_id）
        """
        try:
            # Django传递的是pk值，对于我们的模型就是user_id
            return User.objects.get(user_id=user_id)
        except (User.DoesNotExist, TypeError, ValueError):
            return None


class CSRFExemptSessionAuthentication(SessionAuthentication):
    """
    自定义SessionAuthentication，不要求CSRF token
    用于API视图，因为API通常使用其他方式（如JWT）进行安全验证
    """
    def enforce_csrf(self, request):
        """
        不强制执行CSRF检查
        """
        return  # 不执行CSRF检查
