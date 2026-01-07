from django.db import models


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    avatar_url = models.URLField(blank=True, null=True)
    is_approved = models.BooleanField(default=True, help_text='用户是否已激活（已废弃，默认True）')
    created_at = models.DateTimeField(auto_now_add=True)

    # Django认证系统需要的属性
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True, verbose_name='最后登录时间')

    # 为了兼容Django认证系统，添加这些属性和方法
    @property
    def pk(self):
        """返回主键，Django认证系统使用pk而不是user_id"""
        return self.user_id
    
    @property
    def id(self):
        """返回ID"""
        return self.user_id
    
    @property
    def is_authenticated(self):
        """用户是否已认证"""
        return True
    
    @property
    def is_anonymous(self):
        """用户是否匿名"""
        return False
    
    def get_username(self):
        """获取用户名"""
        return self.username
    
    def has_perm(self, perm, obj=None):
        """检查用户权限"""
        return self.is_superuser
    
    def has_module_perms(self, app_label):
        """检查用户是否有应用权限"""
        return self.is_superuser
    
    def __str__(self):
        return self.username


class Tag(models.Model):
    tag_id = models.AutoField(primary_key=True)
    tag_name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.tag_name


class AIModel(models.Model):
    ai_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    developer = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_text = models.CharField(max_length=255, blank=True)
    official_url = models.URLField(blank=True)
    avg_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    favorite_count = models.PositiveIntegerField(default=0)
    tags = models.ManyToManyField(Tag, through='AITag', related_name='ai_models')

    def __str__(self):
        return self.name


class Rating(models.Model):
    rating_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='ratings')
    # 总评分（通用性评价，独立于下面的五个细则）
    overall_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text='AI模型的总体评分（0-10分）')
    # 五个细则评分
    versatility_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text='万能性评分（0-10分）')
    image_generation_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text='图像生成能力评分（0-10分）')
    information_query_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text='信息查询能力评分（0-10分）')
    study_assistance_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text='学习辅助能力评分（0-10分）')
    value_for_money_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text='性价比评分（0-10分）')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'ai')


class Comment(models.Model):
    comment_id = models.AutoField(primary_key=True)
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent_comment = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    upvotes = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'Comment {self.id} on {self.ai_id}'


class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')

    class Meta:
        unique_together = ('user', 'comment')


class CommentImage(models.Model):
    image_id = models.AutoField(primary_key=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='images')
    url = models.URLField()


class AITag(models.Model):
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_tags')

    class Meta:
        unique_together = ('ai', 'tag', 'user')


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user', 'ai')


class Reaction(models.Model):
    """用户对AI的反应（点赞、点踩、惊叹、差评）"""
    REACTION_TYPES = [
        ('thumbUp', '点赞'),
        ('thumbDown', '点踩'),
        ('amazing', '惊叹'),
        ('bad', '差评'),
    ]
    
    reaction_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='reactions')
    reaction_type = models.CharField(max_length=20, choices=REACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'ai', 'reaction_type')
        indexes = [
            models.Index(fields=['ai', 'reaction_type']),
        ]

    def __str__(self):
        return f'{self.user.username} - {self.ai.name} - {self.reaction_type}'

