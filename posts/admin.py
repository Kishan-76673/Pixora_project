from django.contrib import admin
from .models import Post, Like, Comment, Story, StoryView

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'caption', 'like_count', 'comment_count', 'created_at']
    list_filter = ['created_at', 'media_type']
    search_fields = ['user__username', 'caption']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'text', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'text']

@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'media_type', 'created_at', 'expires_at', 'is_expired']
    list_filter = ['created_at', 'media_type']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'expires_at']

@admin.register(StoryView)
class StoryViewAdmin(admin.ModelAdmin):
    list_display = ['user', 'story', 'viewed_at']
    list_filter = ['viewed_at']