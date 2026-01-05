from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login as django_login, logout as django_logout
from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from django.shortcuts import redirect

from .models import AIModel, Comment, User, Rating, Favorite
from .serializers import AIModelSerializer, CommentSerializer, UserSerializer, UserPublicSerializer, RatingSerializer


class AIModelList(generics.ListAPIView):
    queryset = AIModel.objects.all().prefetch_related('tags')
    serializer_class = AIModelSerializer


class CommentList(generics.ListAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        qs = Comment.objects.select_related('ai', 'user', 'parent_comment')
        ai_id = self.request.query_params.get('ai_id')
        return qs.filter(ai_id=ai_id) if ai_id else qs


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """用户注册API"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # 返回用户信息（不包含密码）
        user_data = UserPublicSerializer(user).data
        message = '注册成功，请等待管理员审核通过后即可登录' if not user.is_approved else '注册成功'
        return Response({
            'success': True,
            'user': user_data,
            'message': message,
            'requires_approval': not user.is_approved
        }, status=status.HTTP_201_CREATED)
    
    # 处理验证错误
    error_messages = []
    for field, errors in serializer.errors.items():
        if isinstance(errors, list):
            error_messages.extend(errors)
        else:
            error_messages.append(str(errors))
    
    return Response(
        {'error': error_messages[0] if error_messages else '注册失败', 'details': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """用户登录API - 使用Session + Cookie认证"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': '请提供用户名和密码'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {'error': '用户名或密码错误'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # 检查用户是否已被管理员批准
    if not user.is_approved:
        return Response(
            {'error': '您的账号尚未通过管理员审核，请等待审核通过后再登录'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 验证密码
    if check_password(password, user.password_hash):
        try:
            # 使用Django的login函数创建session
            # 确保用户对象有backend属性
            user.backend = 'backend.authentication.CustomUserBackend'
            django_login(request, user)
            user_data = UserPublicSerializer(user).data
            return Response({
                'success': True,
                'user': user_data,
                'message': '登录成功'
            })
        except Exception as e:
            # 记录错误以便调试
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"登录时发生错误: {e}")
            logger.error(traceback.format_exc())
            print(f"登录时发生错误: {e}")
            print(traceback.format_exc())
            return Response(
                {'error': f'登录失败：{str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    else:
        return Response(
            {'error': '用户名或密码错误'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """检查用户是否登录（通过Session）"""
    if request.user.is_authenticated:
        user_data = UserPublicSerializer(request.user).data
        return Response({
            'authenticated': True,
            'user': user_data
        })
    return Response({
        'authenticated': False
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """用户登出API"""
    django_logout(request)
    return Response({
        'success': True,
        'message': '登出成功'
    })


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request):
    """收藏/取消收藏AI - 需要登录"""
    # 检查用户是否已认证
    if not request.user.is_authenticated:
        return Response(
            {'error': '请先登录', 'detail': 'Session认证失败，请重新登录'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    ai_id = request.data.get('ai_id')
    
    if not ai_id:
        return Response(
            {'error': '请提供AI ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 从session中获取当前登录用户
    user = request.user
    
    try:
        ai = AIModel.objects.get(ai_id=ai_id)
    except AIModel.DoesNotExist:
        return Response(
            {'error': 'AI不存在'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # 检查是否已收藏
    favorite, created = Favorite.objects.get_or_create(user=user, ai=ai)
    
    if not created:
        # 如果已存在，则取消收藏
        favorite.delete()
        ai.favorite_count = max(0, ai.favorite_count - 1)
        ai.save()
        return Response({
            'success': True,
            'is_favorite': False,
            'message': '已取消收藏'
        })
    else:
        # 新增收藏
        ai.favorite_count = (ai.favorite_count or 0) + 1
        ai.save()
        return Response({
            'success': True,
            'is_favorite': True,
            'message': '收藏成功'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_favorites(request):
    """获取当前登录用户的收藏列表"""
    # 检查用户是否已认证
    if not request.user.is_authenticated:
        return Response(
            {'error': '请先登录', 'detail': 'Session认证失败，请重新登录'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # 从session中获取当前登录用户
    user = request.user
    favorites = Favorite.objects.filter(user=user).select_related('ai')
    ai_ids = [fav.ai.ai_id for fav in favorites]
    return Response({
        'success': True,
        'favorite_ids': ai_ids
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_rating(request):
    """提交评分API - 支持创建和更新，需要登录"""
    # 检查用户是否已认证
    if not request.user.is_authenticated:
        return Response(
            {'error': '请先登录', 'detail': 'Session认证失败，请重新登录'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    ai_id = request.data.get('ai_id')
    
    if not ai_id:
        return Response(
            {'error': '请提供AI ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 从session中获取当前登录用户
    user = request.user
    
    try:
        ai = AIModel.objects.get(ai_id=ai_id)
    except AIModel.DoesNotExist:
        return Response(
            {'error': 'AI不存在'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # 准备评分数据
    rating_scores = {
        'versatility_score': int(request.data.get('versatility_score', 0)),
        'image_generation_score': int(request.data.get('image_generation_score', 0)),
        'information_query_score': int(request.data.get('information_query_score', 0)),
        'study_assistance_score': int(request.data.get('study_assistance_score', 0)),
        'value_for_money_score': int(request.data.get('value_for_money_score', 0)),
    }
    
    # 直接使用update_or_create来更新或创建评分
    rating, created = Rating.objects.update_or_create(
        user=user,
        ai=ai,
        defaults=rating_scores
    )
    
    # 更新AI的平均分和评分数量
    from django.db.models import Avg
    ratings = Rating.objects.filter(ai=ai)
    ai.rating_count = ratings.count()
    
    avg_scores = ratings.aggregate(
        versatility=Avg('versatility_score'),
        image_generation=Avg('image_generation_score'),
        information_query=Avg('information_query_score'),
        study_assistance=Avg('study_assistance_score'),
        value_for_money=Avg('value_for_money_score')
    )
    
    total_avg = (
        (avg_scores['versatility'] or 0) +
        (avg_scores['image_generation'] or 0) +
        (avg_scores['information_query'] or 0) +
        (avg_scores['study_assistance'] or 0) +
        (avg_scores['value_for_money'] or 0)
    ) / 5
    
    ai.avg_score = round(total_avg, 2)
    ai.save()
    
    # 返回序列化后的评分数据
    serializer = RatingSerializer(rating)
    return Response({
        'success': True,
        'message': '评分保存成功' + ('（已更新）' if not created else '（已创建）'),
        'rating': serializer.data,
        'is_update': not created
    }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


def api_root(request):
    """API根路径，显示API信息和链接"""
    from django.http import HttpResponse
    
    html_content = """
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rate AI API</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #2fa1f8;
                margin-top: 0;
            }
            .section {
                margin: 20px 0;
                padding: 15px;
                background: #f8fafc;
                border-radius: 5px;
            }
            .section h2 {
                margin-top: 0;
                color: #0f172a;
                font-size: 1.2em;
            }
            a {
                color: #2fa1f8;
                text-decoration: none;
                display: inline-block;
                margin: 5px 10px 5px 0;
                padding: 8px 15px;
                background: #e0f2fe;
                border-radius: 4px;
                transition: background 0.2s;
            }
            a:hover {
                background: #bae6fd;
            }
            .endpoint {
                font-family: 'Monaco', 'Courier New', monospace;
                background: #1e293b;
                color: #e2e8f0;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.9em;
            }
            .admin-link {
                background: #3b82f6;
                color: white;
                font-weight: bold;
                padding: 12px 20px;
                margin-top: 20px;
            }
            .admin-link:hover {
                background: #2563eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Rate AI API</h1>
            <p>欢迎使用 Rate AI 后端API服务</p>
            
            <div class="section">
                <h2>📊 管理界面</h2>
                <a href="/admin/" class="admin-link">进入 Django Admin 管理界面</a>
                <p style="margin-top: 10px; color: #64748b;">
                    使用Django Admin可以管理所有数据：用户、AI工具、评分、评论等
                </p>
            </div>
            
            <div class="section">
                <h2>🔗 API 端点</h2>
                <p><strong>AI相关：</strong></p>
                <a href="/api/ais/" target="_blank"><span class="endpoint">GET</span> /api/ais/</a>
                <p style="margin-top: 10px;"><strong>评论相关：</strong></p>
                <a href="/api/comments/" target="_blank"><span class="endpoint">GET</span> /api/comments/</a>
                <p style="margin-top: 10px;"><strong>用户相关：</strong></p>
                <a href="/api/register/" target="_blank"><span class="endpoint">POST</span> /api/register/</a>
                <a href="/api/login/" target="_blank"><span class="endpoint">POST</span> /api/login/</a>
                <a href="/api/check-auth/" target="_blank"><span class="endpoint">GET</span> /api/check-auth/</a>
            </div>
            
            <div class="section">
                <h2>📝 使用说明</h2>
                <ul>
                    <li>前端应用运行在 <code>http://localhost:5173</code></li>
                    <li>后端API运行在 <code>http://127.0.0.1:8000</code></li>
                    <li>访问 <a href="/admin/">/admin/</a> 管理数据库内容</li>
                    <li>首次使用需要创建超级用户：<code>python manage.py createsuperuser</code></li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

