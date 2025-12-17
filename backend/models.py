from django.db import models


class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    avatar_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Tag(models.Model):
    tag_name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.tag_name


class AIModel(models.Model):
    name = models.CharField(max_length=255)
    developer = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_text = models.CharField(max_length=255, blank=True)
    official_url = models.URLField(blank=True)
    avg_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    favorite_count = models.PositiveIntegerField(default=0)
    reactions_thumb_up = models.PositiveIntegerField(default=0)
    reactions_thumb_down = models.PositiveIntegerField(default=0)
    reactions_amazing = models.PositiveIntegerField(default=0)
    reactions_bad = models.PositiveIntegerField(default=0)
    tags = models.ManyToManyField(Tag, through='AITag', related_name='ai_models')

    def __str__(self):
        return self.name


class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='ratings')
    versatility_score = models.PositiveSmallIntegerField()
    image_generation_score = models.PositiveSmallIntegerField()
    information_query_score = models.PositiveSmallIntegerField()
    study_assistance_score = models.PositiveSmallIntegerField()
    value_for_money_score = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'ai')


class Comment(models.Model):
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
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='images')
    url = models.URLField()


class AITag(models.Model):
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('ai', 'tag')


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    ai = models.ForeignKey(AIModel, on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user', 'ai')

