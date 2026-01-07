from django.contrib import admin
from django.utils.html import format_html

from .models import User, AIModel, Rating, Comment, CommentLike, CommentImage, Tag, AITag, Favorite


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'username', 'email', 'created_at', 'get_ratings_count', 'get_comments_count', 'get_favorites_count')
    list_filter = ('created_at',)
    search_fields = ('username', 'email')
    readonly_fields = ('user_id', 'created_at', 'last_login', 'is_approved')
    ordering = ('-created_at',)
    
    # 批量操作 - 用于删除用户
    actions = ['delete_users']
    
    # 详情页字段分组 - 排除 password_hash 字段
    exclude = ('password_hash',)
    
    fieldsets = (
        ('基本信息', {
            'fields': ('user_id', 'username', 'email', 'avatar_url')
        }),
        ('状态', {
            'fields': ('is_active', 'is_staff', 'is_superuser')
        }),
        ('时间信息', {
            'fields': ('created_at', 'last_login')
        }),
    )
    
    class Meta:
        verbose_name = '应用用户'
        verbose_name_plural = '应用用户'
    
    def get_ratings_count(self, obj):
        return obj.ratings.count()
    get_ratings_count.short_description = '评分数量'
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    get_comments_count.short_description = '评论数量'
    
    def get_favorites_count(self, obj):
        return obj.favorites.count()
    get_favorites_count.short_description = '收藏数量'
    
    def save_model(self, request, obj, form, change):
        """保存模型时，确保密码哈希字段保留原有值"""
        if change and obj.pk:  # 编辑现有对象
            # 由于表单中没有 password_hash 字段，必须从数据库中获取原有的值
            # 避免外键约束失败
            try:
                old_obj = User.objects.get(pk=obj.pk)
                # 始终保留原有的密码哈希值，除非用户明确修改
                if obj.password_hash != old_obj.password_hash:
                    # 如果用户没有修改密码，保留原值
                    if not obj.password_hash or len(obj.password_hash) == 0:
                        obj.password_hash = old_obj.password_hash
            except (User.DoesNotExist, AttributeError):
                pass
        # 确保 password_hash 不为空
        if not obj.password_hash:
            if change and obj.pk:
                try:
                    old_obj = User.objects.get(pk=obj.pk)
                    obj.password_hash = old_obj.password_hash
                except User.DoesNotExist:
                    pass
        super().save_model(request, obj, form, change)
    
    @admin.action(description='删除选中的用户及其所有数据')
    def delete_users(self, request, queryset):
        """批量删除用户及其所有关联数据"""
        from .models import CommentImage
        from django.db.models import Count
        
        count = 0
        deleted_data = {
            'ratings': 0,
            'comments': 0,
            'favorites': 0,
            'comment_likes': 0,
            'comment_images': 0
        }
        
        for user in queryset:
            # 统计要删除的数据（在删除前统计）
            ratings = user.ratings.all()
            comments = user.comments.all()
            deleted_data['ratings'] += ratings.count()
            deleted_data['comments'] += comments.count()
            deleted_data['favorites'] += user.favorites.count()
            deleted_data['comment_likes'] += user.comment_likes.count()
            
            # 统计评论图片（通过评论获取）
            for comment in comments:
                deleted_data['comment_images'] += comment.images.count()
            
            # 删除用户（级联删除会自动删除相关数据）
            # CASCADE 会自动删除：
            # - 所有评分 (ratings)
            # - 所有评论 (comments) 及其回复 (parent_comment)
            # - 所有评论图片 (comment_images, 通过 Comment CASCADE)
            # - 所有点赞 (comment_likes)
            # - 所有收藏 (favorites)
            user.delete()
            count += 1
        
        self.message_user(
            request,
            f'✅ 成功删除了 {count} 个用户及其所有数据：\n'
            f'  - {deleted_data["ratings"]} 条评分\n'
            f'  - {deleted_data["comments"]} 条评论\n'
            f'  - {deleted_data["comment_images"]} 张评论图片\n'
            f'  - {deleted_data["favorites"]} 个收藏\n'
            f'  - {deleted_data["comment_likes"]} 个点赞\n'
            f'\n注意：标签是共享资源，不会因为删除用户而删除。',
            level='success'
        )
    delete_users.short_description = '删除选中的用户'
    
    def delete_model(self, request, obj):
        """删除单个用户模型"""
        from .models import CommentImage
        
        # 统计要删除的数据（在删除前统计，因为删除后无法获取）
        ratings = obj.ratings.all()
        comments = obj.comments.all()
        rating_count = ratings.count()
        comment_count = comments.count()
        favorite_count = obj.favorites.count()
        like_count = obj.comment_likes.count()
        
        # 统计评论图片
        comment_images_count = 0
        for comment in comments:
            comment_images_count += comment.images.count()
        
        username = obj.username
        
        # 删除用户（级联删除会自动删除相关数据）
        # CASCADE 会自动删除：
        # - 所有评分 (ratings)
        # - 所有评论 (comments) 及其回复 (parent_comment CASCADE)
        # - 所有评论图片 (comment_images, 通过 Comment CASCADE)
        # - 所有点赞 (comment_likes)
        # - 所有收藏 (favorites)
        obj.delete()
        
        self.message_user(
            request,
            f'✅ 成功删除用户 "{username}" 及其所有数据：\n'
            f'  - {rating_count} 条评分\n'
            f'  - {comment_count} 条评论\n'
            f'  - {comment_images_count} 张评论图片\n'
            f'  - {favorite_count} 个收藏\n'
            f'  - {like_count} 个点赞\n'
            f'\n注意：标签是共享资源，不会因为删除用户而删除。',
            level='success'
        )
    
    def delete_queryset(self, request, queryset):
        """批量删除用户（Django Admin 默认调用此方法）"""
        from .models import CommentImage
        
        count = 0
        deleted_data = {
            'ratings': 0,
            'comments': 0,
            'favorites': 0,
            'comment_likes': 0,
            'comment_images': 0
        }
        
        for user in queryset:
            # 统计要删除的数据（在删除前统计）
            ratings = user.ratings.all()
            comments = user.comments.all()
            deleted_data['ratings'] += ratings.count()
            deleted_data['comments'] += comments.count()
            deleted_data['favorites'] += user.favorites.count()
            deleted_data['comment_likes'] += user.comment_likes.count()
            
            # 统计评论图片
            for comment in comments:
                deleted_data['comment_images'] += comment.images.count()
            
            # 删除用户（级联删除会自动删除相关数据）
            user.delete()
            count += 1
        
        self.message_user(
            request,
            f'✅ 成功删除了 {count} 个用户及其所有数据：\n'
            f'  - {deleted_data["ratings"]} 条评分\n'
            f'  - {deleted_data["comments"]} 条评论\n'
            f'  - {deleted_data["comment_images"]} 张评论图片\n'
            f'  - {deleted_data["favorites"]} 个收藏\n'
            f'  - {deleted_data["comment_likes"]} 个点赞\n'
            f'\n注意：标签是共享资源，不会因为删除用户而删除。',
            level='success'
        )


class AITagInline(admin.TabularInline):
    """内联管理AI标签关系"""
    model = AITag
    extra = 1


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('ai_id', 'name', 'developer', 'avg_score', 'rating_count', 'favorite_count', 'get_tags_display')
    list_filter = ('avg_score', 'rating_count')
    search_fields = ('name', 'developer', 'description')
    readonly_fields = ('ai_id', 'avg_score', 'rating_count', 'favorite_count')
    ordering = ('-avg_score',)
    inlines = [AITagInline]
    
    def get_tags_display(self, obj):
        tags = obj.tags.all()[:5]
        return ', '.join([tag.tag_name for tag in tags]) if tags else '无标签'
    get_tags_display.short_description = '标签'


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('rating_id', 'user', 'ai', 'versatility_score', 'image_generation_score', 
                   'information_query_score', 'study_assistance_score', 'value_for_money_score', 'created_at')
    list_filter = ('created_at', 'versatility_score', 'value_for_money_score')
    search_fields = ('user__username', 'ai__name')
    readonly_fields = ('rating_id', 'created_at')
    ordering = ('-created_at',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('comment_id', 'user', 'ai', 'content_preview', 'upvotes', 'created_at', 'has_parent')
    list_filter = ('created_at', 'upvotes')
    search_fields = ('user__username', 'ai__name', 'content')
    readonly_fields = ('comment_id', 'created_at')
    ordering = ('-created_at',)
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = '内容预览'
    
    def has_parent(self, obj):
        return '是' if obj.parent_comment else '否'
    has_parent.short_description = '是回复'


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'comment', 'get_comment_ai')
    search_fields = ('user__username', 'comment__content')
    
    def get_comment_ai(self, obj):
        return obj.comment.ai.name
    get_comment_ai.short_description = '评论所属AI'


@admin.register(CommentImage)
class CommentImageAdmin(admin.ModelAdmin):
    list_display = ('image_id', 'comment', 'get_image_preview', 'get_comment_user')
    search_fields = ('comment__content',)
    
    def get_image_preview(self, obj):
        if obj.url:
            return format_html('<img src="{}" style="max-width: 100px; max-height: 100px;" />', obj.url)
        return '无图片'
    get_image_preview.short_description = '图片预览'
    
    def get_comment_user(self, obj):
        return obj.comment.user.username
    get_comment_user.short_description = '评论用户'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('tag_id', 'tag_name', 'get_ai_count')
    search_fields = ('tag_name',)
    ordering = ('tag_name',)
    
    def get_ai_count(self, obj):
        return obj.ai_models.count()
    get_ai_count.short_description = '使用该标签的AI数量'


@admin.register(AITag)
class AITagAdmin(admin.ModelAdmin):
    list_display = ('id', 'ai', 'tag')
    list_filter = ('tag',)
    search_fields = ('ai__name', 'tag__tag_name')


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ai', 'get_ai_score')
    search_fields = ('user__username', 'ai__name')
    
    def get_ai_score(self, obj):
        return obj.ai.avg_score
    get_ai_score.short_description = 'AI评分'

