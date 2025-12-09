from rest_framework import serializers
from .models import Post, Like, Comment, Story, StoryView
from accounts.serializers import UserSerializer

class PostSerializer(serializers.ModelSerializer):
    """Post serializer with user and media details"""
    
    user = UserSerializer(read_only=True)
    media_url = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'user', 'caption', 'media', 'media_url', 'media_type',
            'like_count', 'comment_count', 'is_liked', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'like_count', 'comment_count', 'created_at']
    
    def get_media_url(self, obj):
        """Get full media URL"""
        request = self.context.get('request')
        if obj.media and request:
            return request.build_absolute_uri(obj.media.url)
        return None
    
    def get_is_liked(self, obj):
        """Check if current user liked the post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts"""
    
    class Meta:
        model = Post
        fields = ['caption', 'media', 'media_type']
    
    def validate_media(self, value):
        """Validate file size and type"""
        # Max 10MB
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        return value


class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'post', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at']


class LikeSerializer(serializers.ModelSerializer):
    """Like serializer"""
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class StorySerializer(serializers.ModelSerializer):
    """Story serializer"""
    
    user = UserSerializer(read_only=True)
    media_url = serializers.SerializerMethodField()
    is_viewed = serializers.SerializerMethodField()
    view_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Story
        fields = [
            'id', 'user', 'media', 'media_url', 'media_type',
            'created_at', 'expires_at', 'is_viewed', 'view_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'expires_at']
    
    def get_media_url(self, obj):
        request = self.context.get('request')
        if obj.media and request:
            return request.build_absolute_uri(obj.media.url)
        return None
    
    def get_is_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return StoryView.objects.filter(story=obj, user=request.user).exists()
        return False
    
    def get_view_count(self, obj):
        return obj.views.count()


class StoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating stories"""
    
    class Meta:
        model = Story
        fields = ['media', 'media_type']
    
    def validate_media(self, value):
        # Max 10MB for stories
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        return value