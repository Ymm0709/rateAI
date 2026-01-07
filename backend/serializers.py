from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Avg

from .models import AIModel, Comment, Tag, User, Rating, AITag, Reaction


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['tag_id', 'tag_name']


class AIModelSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    overall_score = serializers.SerializerMethodField()
    versatility_score = serializers.SerializerMethodField()
    image_generation_score = serializers.SerializerMethodField()
    information_query_score = serializers.SerializerMethodField()
    study_assistance_score = serializers.SerializerMethodField()
    value_for_money_score = serializers.SerializerMethodField()
    reactions_thumb_up = serializers.SerializerMethodField()
    reactions_thumb_down = serializers.SerializerMethodField()
    reactions_amazing = serializers.SerializerMethodField()
    reactions_bad = serializers.SerializerMethodField()

    class Meta:
        model = AIModel
        fields = [
            'ai_id',
            'name',
            'developer',
            'description',
            'price',
            'price_text',
            'official_url',
            'avg_score',
            'rating_count',
            'favorite_count',
            'tags',
            'overall_score',
            'versatility_score',
            'image_generation_score',
            'information_query_score',
            'study_assistance_score',
            'value_for_money_score',
            'reactions_thumb_up',
            'reactions_thumb_down',
            'reactions_amazing',
            'reactions_bad',
        ]
    
    def get_overall_score(self, obj):
        """计算总评分的平均值（通用性评价）"""
        result = Rating.objects.filter(ai=obj, overall_score__isnull=False).aggregate(avg=Avg('overall_score'))
        return round(float(result['avg']), 1) if result['avg'] is not None else 0.0
    
    def get_versatility_score(self, obj):
        """计算万能性评分的平均值"""
        result = Rating.objects.filter(ai=obj, versatility_score__isnull=False).aggregate(avg=Avg('versatility_score'))
        return round(float(result['avg']), 1) if result['avg'] is not None else 0.0
    
    def get_image_generation_score(self, obj):
        """计算图像生成评分的平均值"""
        result = Rating.objects.filter(ai=obj, image_generation_score__isnull=False).aggregate(avg=Avg('image_generation_score'))
        return round(float(result['avg']), 1) if result['avg'] is not None else 0.0
    
    def get_information_query_score(self, obj):
        """计算信息查询评分的平均值"""
        result = Rating.objects.filter(ai=obj, information_query_score__isnull=False).aggregate(avg=Avg('information_query_score'))
        return round(float(result['avg']), 1) if result['avg'] is not None else 0.0
    
    def get_study_assistance_score(self, obj):
        """计算学习辅助评分的平均值"""
        result = Rating.objects.filter(ai=obj, study_assistance_score__isnull=False).aggregate(avg=Avg('study_assistance_score'))
        return round(float(result['avg']), 1) if result['avg'] is not None else 0.0
    
    def get_value_for_money_score(self, obj):
        """计算性价比评分的平均值"""
        result = Rating.objects.filter(ai=obj, value_for_money_score__isnull=False).aggregate(avg=Avg('value_for_money_score'))
        return round(float(result['avg']), 1) if result['avg'] is not None else 0.0
    
    def get_reactions_thumb_up(self, obj):
        """点赞数"""
        try:
            return Reaction.objects.filter(ai=obj, reaction_type='thumbUp').count()
        except Exception:
        return 0
    
    def get_reactions_thumb_down(self, obj):
        """点踩数"""
        try:
            return Reaction.objects.filter(ai=obj, reaction_type='thumbDown').count()
        except Exception:
        return 0
    
    def get_reactions_amazing(self, obj):
        """惊叹数"""
        try:
            return Reaction.objects.filter(ai=obj, reaction_type='amazing').count()
        except Exception:
        return 0
    
    def get_reactions_bad(self, obj):
        """差评数"""
        try:
            return Reaction.objects.filter(ai=obj, reaction_type='bad').count()
        except Exception:
        return 0
    
    def get_user_reaction(self, obj):
        """获取当前用户的反应类型"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_reaction = Reaction.objects.filter(
                ai=obj, 
                user=request.user
            ).first()
            return user_reaction.reaction_type if user_reaction else None
        return None
    
    def get_tags(self, obj):
        """获取AI的所有标签及其数量（所有用户添加的标签）"""
        # 返回所有用户为该AI添加的标签及其数量
        from django.db.models import Count
        all_tags = AITag.objects.filter(ai=obj).select_related('tag').values(
            'tag__tag_id', 
            'tag__tag_name'
        ).annotate(
            count=Count('tag_id')
        ).order_by('-count')
        return [
            {
                'tag_id': tag['tag__tag_id'], 
                'tag_name': tag['tag__tag_name'],
                'count': tag['count']
            } 
            for tag in all_tags
        ]


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    ai = serializers.SerializerMethodField()
    ai_id = serializers.IntegerField(source='ai.ai_id', read_only=True)
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'comment_id',
            'ai_id',
            'ai',
            'user_id',
            'user',
            'parent_comment_id',
            'content',
            'created_at',
            'upvotes',
            'images',
        ]
    
    def get_user(self, obj):
        if obj.user:
            return {
                'user_id': obj.user.user_id,
                'username': obj.user.username
            }
        return None
    
    def get_ai(self, obj):
        if obj.ai:
            return {
                'ai_id': obj.ai.ai_id,
                'name': obj.ai.name
            }
        return None
    
    def get_images(self, obj):
        # 获取评论的图片
        from .models import CommentImage
        images = CommentImage.objects.filter(comment=obj)
        return [img.url for img in images]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'password', 'avatar_url', 'created_at']
        read_only_fields = ['user_id', 'created_at']
        extra_kwargs = {
            'username': {'min_length': 3},
            'email': {'required': True}
        }
    
    def validate_email(self, value):
        """验证邮箱格式"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("邮箱已被注册")
        return value
    
    def validate_username(self, value):
        """验证用户名"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("用户名已存在")
        return value
    
    def create(self, validated_data):
        # 加密密码并保存
        password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(password)
        # 新用户默认已激活（不需要审核）
        validated_data['is_approved'] = True
        return super().create(validated_data)


class UserPublicSerializer(serializers.ModelSerializer):
    """公开的用户信息，不包含敏感数据"""
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'avatar_url', 'is_approved', 'created_at']


class RatingSerializer(serializers.ModelSerializer):
    """评分序列化器"""
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True)
    ai_id = serializers.PrimaryKeyRelatedField(source='ai', queryset=AIModel.objects.all(), write_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'rating_id',
            'user_id',
            'ai_id',
            'overall_score',
            'versatility_score',
            'image_generation_score',
            'information_query_score',
            'study_assistance_score',
            'value_for_money_score',
            'created_at'
        ]
        read_only_fields = ['rating_id', 'created_at']
    
    def create(self, validated_data):
        # 如果用户已经对该AI评分过，则更新而不是创建
        user = validated_data.pop('user')  # 从validated_data中获取user对象
        ai = validated_data.pop('ai')  # 从validated_data中获取ai对象
        
        # 准备更新的数据
        update_data = {
            'versatility_score': validated_data.get('versatility_score', 0),
            'image_generation_score': validated_data.get('image_generation_score', 0),
            'information_query_score': validated_data.get('information_query_score', 0),
            'study_assistance_score': validated_data.get('study_assistance_score', 0),
            'value_for_money_score': validated_data.get('value_for_money_score', 0),
        }
        
        # 使用update_or_create来更新或创建评分
        rating, created = Rating.objects.update_or_create(
            user=user,
            ai=ai,
            defaults=update_data
        )
        
        # 如果已存在，强制刷新以获取最新数据
        if not created:
            rating.refresh_from_db()
        
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
        
        return rating

