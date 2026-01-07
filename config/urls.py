"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth.models import Group
from django.urls import path

from backend.views import AIModelList, CommentList, register, login, logout, check_auth, api_root, submit_rating, toggle_favorite, get_user_favorites, submit_comment, add_tag_to_ai, get_user_comments, get_user_rating, toggle_reaction, get_user_reaction

# 隐藏Django内置的Group和User（因为我们使用自定义的User模型）
admin.site.unregister(Group)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/ais/', AIModelList.as_view()),
    path('api/comments/', CommentList.as_view()),
    path('api/comments/create/', submit_comment, name='submit-comment'),
    path('api/tags/add/', add_tag_to_ai, name='add-tag'),
    path('api/users/comments/', get_user_comments, name='get-user-comments'),
    path('api/register/', register, name='register'),
    path('api/login/', login, name='login'),
    path('api/logout/', logout, name='logout'),
    path('api/check-auth/', check_auth, name='check-auth'),
    path('api/ratings/', submit_rating, name='submit-rating'),
    path('api/ratings/<int:ai_id>/', get_user_rating, name='get-user-rating'),
    path('api/reactions/', toggle_reaction, name='toggle-reaction'),
    path('api/reactions/<int:ai_id>/', get_user_reaction, name='get-user-reaction'),
    path('api/favorites/', toggle_favorite, name='toggle-favorite'),
    path('api/favorites/list/', get_user_favorites, name='get-favorites'),
]
