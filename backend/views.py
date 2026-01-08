from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login as django_login, logout as django_logout
from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from django.shortcuts import redirect

from .models import AIModel, Comment, User, Rating, Favorite, Tag, AITag, Reaction
from .serializers import AIModelSerializer, CommentSerializer, UserSerializer, UserPublicSerializer, RatingSerializer
from django.db import transaction


class AIModelList(generics.ListAPIView):
    queryset = AIModel.objects.all()
    serializer_class = AIModelSerializer
    
    def get_serializer_context(self):
        """传递request到序列化器，以便获取当前用户"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


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
        return Response({
            'success': True,
            'user': user_data,
            'message': '注册成功'
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
    
    # 准备评分数据（只更新提供的字段，其他字段保持原值）
    rating_scores = {}
    
    # 总评分（可选）
    if 'overall_score' in request.data:
        overall = request.data.get('overall_score')
        if overall is not None and overall != '':
            rating_scores['overall_score'] = int(overall)
        else:
            rating_scores['overall_score'] = None
    
    # 五个细则评分（可选，只在详情页提交）
    if 'versatility_score' in request.data:
        versatility = request.data.get('versatility_score')
        rating_scores['versatility_score'] = int(versatility) if versatility is not None and versatility != '' else None
    
    if 'image_generation_score' in request.data:
        img_gen = request.data.get('image_generation_score')
        rating_scores['image_generation_score'] = int(img_gen) if img_gen is not None and img_gen != '' else None
    
    if 'information_query_score' in request.data:
        info_query = request.data.get('information_query_score')
        rating_scores['information_query_score'] = int(info_query) if info_query is not None and info_query != '' else None
    
    if 'study_assistance_score' in request.data:
        study = request.data.get('study_assistance_score')
        rating_scores['study_assistance_score'] = int(study) if study is not None and study != '' else None
    
    if 'value_for_money_score' in request.data:
        value = request.data.get('value_for_money_score')
        rating_scores['value_for_money_score'] = int(value) if value is not None and value != '' else None
    
    # 如果没有任何评分数据，返回错误
    if not rating_scores:
        return Response(
            {'error': '请至少提供一个评分'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 获取或创建评分对象
    rating, created = Rating.objects.get_or_create(user=user, ai=ai)
    
    # 更新评分字段（只更新提供的字段）
    for key, value in rating_scores.items():
        setattr(rating, key, value)
    rating.save()
    
    # 更新AI的平均分（使用总评分作为avg_score，如果有的话）
    from django.db.models import Avg
    ratings_with_overall = Rating.objects.filter(ai=ai, overall_score__isnull=False)
    
    if ratings_with_overall.exists():
        overall_avg = ratings_with_overall.aggregate(avg=Avg('overall_score'))['avg']
        ai.avg_score = round(float(overall_avg), 1) if overall_avg else 0.0
    else:
        # 如果没有总评分，使用五个细则的平均值作为总评分
        ratings_with_details = Rating.objects.filter(ai=ai).exclude(
            versatility_score__isnull=True,
            image_generation_score__isnull=True,
            information_query_score__isnull=True,
            study_assistance_score__isnull=True,
            value_for_money_score__isnull=True
        )
        if ratings_with_details.exists():
            avg_scores = ratings_with_details.aggregate(
                versatility=Avg('versatility_score'),
                image_generation=Avg('image_generation_score'),
                information_query=Avg('information_query_score'),
                study_assistance=Avg('study_assistance_score'),
                value_for_money=Avg('value_for_money_score')
            )
            scores_list = [
                avg_scores['versatility'],
                avg_scores['image_generation'],
                avg_scores['information_query'],
                avg_scores['study_assistance'],
                avg_scores['value_for_money']
            ]
            valid_scores = [s for s in scores_list if s is not None]
            if valid_scores:
                ai.avg_score = round(sum(valid_scores) / len(valid_scores), 1)
            else:
                ai.avg_score = 0.0
        else:
            ai.avg_score = 0.0
    
    # 更新评分数量（至少有一个非空评分的用户数）
    ai.rating_count = Rating.objects.filter(ai=ai).exclude(
        overall_score__isnull=True,
        versatility_score__isnull=True,
        image_generation_score__isnull=True,
        information_query_score__isnull=True,
        study_assistance_score__isnull=True,
        value_for_money_score__isnull=True
    ).count()
    ai.save()
    
    # 返回序列化后的评分数据
    serializer = RatingSerializer(rating)
    return Response({
        'success': True,
        'message': '评分保存成功' + ('（已更新）' if not created else '（已创建）'),
        'rating': serializer.data,
        'is_update': not created
    }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_comment(request):
    """提交评论API - 需要登录"""
    if not request.user.is_authenticated:
        return Response(
            {'error': '请先登录', 'detail': 'Session认证失败，请重新登录'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    ai_id = request.data.get('ai_id')
    content = request.data.get('content')
    parent_comment_id = request.data.get('parent_comment_id', None)
    
    if not ai_id:
        return Response(
            {'error': '请提供AI ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not content or not content.strip():
        return Response(
            {'error': '评论内容不能为空'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    try:
        ai = AIModel.objects.get(ai_id=ai_id)
    except AIModel.DoesNotExist:
        return Response(
            {'error': 'AI不存在'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    parent_comment = None
    if parent_comment_id:
        try:
            parent_comment = Comment.objects.get(comment_id=parent_comment_id)
        except Comment.DoesNotExist:
            return Response(
                {'error': '父评论不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # 创建评论
    comment = Comment.objects.create(
        user=user,
        ai=ai,
        parent_comment=parent_comment,
        content=content.strip()
    )
    
    # 处理评论图片（如果有）
    images = request.data.get('images', [])
    if images:
        from .models import CommentImage
        for image_url in images:
            if image_url:
                CommentImage.objects.create(comment=comment, url=image_url)
    
    serializer = CommentSerializer(comment)
    return Response({
        'success': True,
        'message': '评论发布成功',
        'comment': serializer.data
    }, status=status.HTTP_201_CREATED)


# 预定义的标签列表（与前端保持一致）
ALLOWED_TAG_NAMES = ['万能', '最适合学生', '做PPT很强', '画图一流', '难用', '贵但好用', '免费', '中文友好', '长文本', '多模态']

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_tag_to_ai(request):
    """为AI添加标签API - 需要登录"""
    if not request.user.is_authenticated:
        return Response(
            {'error': '请先登录', 'detail': 'Session认证失败，请重新登录'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    ai_id = request.data.get('ai_id')
    tag_name = request.data.get('tag_name', '').strip()
    
    if not ai_id:
        return Response(
            {'error': '请提供AI ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not tag_name:
        return Response(
            {'error': '标签名称不能为空'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 验证标签是否在允许的列表中
    if tag_name not in ALLOWED_TAG_NAMES:
        return Response({
            'success': False,
            'error': f'标签必须是以下之一：{", ".join(ALLOWED_TAG_NAMES)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        ai = AIModel.objects.get(ai_id=ai_id)
    except AIModel.DoesNotExist:
        return Response(
            {'error': 'AI不存在'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user = request.user
    
    # 获取或创建标签
    tag, created = Tag.objects.get_or_create(tag_name=tag_name)
    
    # 检查用户是否已经为该AI添加过这个标签
    aitag, aitag_created = AITag.objects.get_or_create(
        ai=ai, 
        tag=tag, 
        user=user,
        defaults={'ai': ai, 'tag': tag, 'user': user}
    )
    
    if not aitag_created:
        return Response({
            'success': False,
            'error': '您已经为该AI添加过这个标签了'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': True,
        'message': '标签添加成功',
        'tag': {
            'tag_id': tag.tag_id,
            'tag_name': tag.tag_name
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_rating(request, ai_id):
    """获取当前登录用户对特定AI的评分详情（未登录返回null）"""
    if not request.user.is_authenticated:
        return Response({
            'success': True,
            'rating': None
        })
    
    user = request.user
    try:
        ai = AIModel.objects.get(ai_id=ai_id)
    except AIModel.DoesNotExist:
        return Response(
            {'error': 'AI不存在'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        rating = Rating.objects.get(user=user, ai=ai)
        return Response({
            'success': True,
            'rating': {
                'overall_score': rating.overall_score,
                'versatility_score': rating.versatility_score,
                'image_generation_score': rating.image_generation_score,
                'information_query_score': rating.information_query_score,
                'study_assistance_score': rating.study_assistance_score,
                'value_for_money_score': rating.value_for_money_score,
            }
        })
    except Rating.DoesNotExist:
        return Response({
            'success': True,
            'rating': None
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_reaction(request):
    """切换用户对AI的反应（点赞、点踩、惊叹、差评）- 需要登录"""
    if not request.user.is_authenticated:
        return Response(
            {'error': '请先登录', 'detail': 'Session认证失败，请重新登录'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    ai_id = request.data.get('ai_id')
    reaction_type = request.data.get('reaction_type')
    
    if not ai_id:
        return Response(
            {'error': '请提供AI ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if reaction_type not in ['thumbUp', 'thumbDown', 'amazing', 'bad']:
        return Response(
            {'error': '无效的反应类型'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    try:
        ai = AIModel.objects.get(ai_id=ai_id)
    except AIModel.DoesNotExist:
        return Response(
            {'error': 'AI不存在'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # 检查用户是否已经对该AI有相同类型的反应
    existing_reaction = Reaction.objects.filter(
        user=user, 
        ai=ai, 
        reaction_type=reaction_type
    ).first()
    
    if existing_reaction:
        # 如果已存在，则取消反应（删除）
        existing_reaction.delete()
        return Response({
            'success': True,
            'is_active': False,
            'message': '已取消反应'
        })
    else:
        # 检查用户是否已经有其他类型的反应
        other_reaction = Reaction.objects.filter(
            user=user, 
            ai=ai
        ).exclude(reaction_type=reaction_type).first()
        
        if other_reaction:
            # 如果已有其他反应，则替换为新的反应类型
            other_reaction.reaction_type = reaction_type
            other_reaction.save()
            return Response({
                'success': True,
                'is_active': True,
                'reaction_type': reaction_type,
                'message': '反应已更新'
            })
        else:
            # 创建新反应
            Reaction.objects.create(
                user=user,
                ai=ai,
                reaction_type=reaction_type
            )
            return Response({
                'success': True,
                'is_active': True,
                'reaction_type': reaction_type,
                'message': '反应已添加'
            })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_reaction(request, ai_id):
    """获取当前登录用户对特定AI的反应（未登录返回null）"""
    if not request.user.is_authenticated:
        return Response({
            'success': True,
            'reaction': None
        })
    
    user = request.user
    try:
        ai = AIModel.objects.get(ai_id=ai_id)
    except AIModel.DoesNotExist:
        return Response(
            {'error': 'AI不存在'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        reaction = Reaction.objects.get(user=user, ai=ai)
        return Response({
            'success': True,
            'reaction': reaction.reaction_type
        })
    except Reaction.DoesNotExist:
        return Response({
            'success': True,
            'reaction': None
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_comments(request):
    """获取当前登录用户的所有评论"""
    if not request.user.is_authenticated:
        return Response(
            {'error': '请先登录', 'detail': 'Session认证失败，请重新登录'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user = request.user
    comments = Comment.objects.filter(user=user).select_related('ai', 'parent_comment').order_by('-created_at')
    
    serializer = CommentSerializer(comments, many=True)
    return Response({
        'success': True,
        'comments': serializer.data
    })


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
                    <li>前端应用运行在 <code>http://localhost:5009</code></li>
                    <li>后端API运行在 <code>http://127.0.0.1:5009</code></li>
                    <li>访问 <a href="/admin/">/admin/</a> 管理数据库内容</li>
                    <li>首次使用需要创建超级用户：<code>python manage.py createsuperuser</code></li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

