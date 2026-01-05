from django.contrib import admin
from django.utils.html import format_html

from .models import User, AIModel, Rating, Comment, CommentLike, CommentImage, Tag, AITag, Favorite


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'username', 'email', 'is_approved', 'created_at', 'get_ratings_count', 'get_comments_count', 'get_favorites_count')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('username', 'email')
    readonly_fields = ('user_id', 'created_at')
    ordering = ('-created_at',)
    list_editable = ('is_approved',)  # 允许直接在列表页编辑审核状态
    
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

