from rest_framework import serializers
from .models import Follow
from accounts.serializers import UserSerializer

class FollowSerializer(serializers.ModelSerializer):
    """Follow serializer"""
    
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['id', 'created_at']