from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Follow
from .serializers import FollowSerializer
from accounts.serializers import UserSerializer

User = get_user_model()

class FollowUserView(APIView):
    """
    POST /api/users/:username/follow/ - Follow a user
    DELETE /api/users/:username/follow/ - Unfollow a user
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, username):
        user_to_follow = get_object_or_404(User, username=username)
        
        # Can't follow yourself
        if user_to_follow == request.user:
            return Response(
                {'error': 'You cannot follow yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already following
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        
        if created:
            return Response({
                'message': f'You are now following {username}',
                'following': True
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': f'You are already following {username}',
                'following': True
            }, status=status.HTTP_200_OK)
    
    def delete(self, request, username):
        user_to_unfollow = get_object_or_404(User, username=username)
        
        try:
            follow = Follow.objects.get(
                follower=request.user,
                following=user_to_unfollow
            )
            follow.delete()
            
            return Response({
                'message': f'You unfollowed {username}',
                'following': False
            }, status=status.HTTP_200_OK)
        except Follow.DoesNotExist:
            return Response({
                'error': 'You are not following this user'
            }, status=status.HTTP_404_NOT_FOUND)


class CheckFollowStatusView(APIView):
    """GET /api/users/:username/follow/status/ - Check if following"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        
        is_following = Follow.objects.filter(
            follower=request.user,
            following=user
        ).exists()
        
        return Response({
            'is_following': is_following
        })


class FollowerListView(generics.ListAPIView):
    """GET /api/users/:username/followers/ - Get user's followers"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        username = self.kwargs['username']
        user = get_object_or_404(User, username=username)
        
        # Get all users who follow this user
        follower_ids = Follow.objects.filter(following=user).values_list('follower', flat=True)
        return User.objects.filter(id__in=follower_ids)


class FollowingListView(generics.ListAPIView):
    """GET /api/users/:username/following/ - Get users this user follows"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        username = self.kwargs['username']
        user = get_object_or_404(User, username=username)
        
        # Get all users this user follows
        following_ids = Follow.objects.filter(follower=user).values_list('following', flat=True)
        return User.objects.filter(id__in=following_ids)