from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import F
from .models import Post, Like, Comment
from .serializers import PostSerializer, PostCreateSerializer, CommentSerializer, LikeSerializer, StorySerializer, StoryCreateSerializer
from django.utils import timezone
from .models import Story, StoryView

class PostListCreateView(generics.ListCreateAPIView):
    """
    GET /api/posts/ - List all posts
    POST /api/posts/ - Create new post
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None 
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer
    
    def get_queryset(self):
        return Post.objects.select_related('user').all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_serializer_context(self):
        return {'request': self.request}


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/posts/:id/ - Get post details
    PATCH /api/posts/:id/ - Update post
    DELETE /api/posts/:id/ - Delete post
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Post.objects.select_related('user').all()
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def perform_destroy(self, instance):
        # Only post owner can delete
        if instance.user != self.request.user:
            return Response(
                {'error': 'You can only delete your own posts'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()

class UserPostsView(generics.ListAPIView):
    """
    GET /api/users/:username/posts/ - Get user's posts
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None
    
    def get_queryset(self):
        username = self.kwargs['username']
        return Post.objects.filter(user__username=username).select_related('user')
    
    def get_serializer_context(self):
        return {'request': self.request}


class LikePostView(APIView):
    """
    POST /api/posts/:id/like/ - Like a post
    DELETE /api/posts/:id/like/ - Unlike a post
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        
        # Check if already liked
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if created:
            # Increment like count
            Post.objects.filter(pk=post.pk).update(like_count=F('like_count') + 1)
            return Response({
                'message': 'Post liked',
                'liked': True
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'Already liked',
                'liked': True
            }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        
        try:
            like = Like.objects.get(user=request.user, post=post)
            like.delete()
            
            # Decrement like count
            Post.objects.filter(pk=post.pk).update(like_count=F('like_count') - 1)
            
            return Response({
                'message': 'Post unliked',
                'liked': False
            }, status=status.HTTP_200_OK)
        except Like.DoesNotExist:
            return Response({
                'error': 'Like not found'
            }, status=status.HTTP_404_NOT_FOUND)


class CommentListCreateView(generics.ListCreateAPIView):
    """
    GET /api/posts/:post_id/comments/ - Get post comments
    POST /api/posts/:post_id/comments/ - Add comment
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        post_id = self.kwargs['post_id']
        return Comment.objects.filter(post_id=post_id).select_related('user')
    
    def perform_create(self, serializer):
        post_id = self.kwargs['post_id']
        post = get_object_or_404(Post, pk=post_id)
        
        # Save comment
        serializer.save(user=self.request.user, post=post)
        
        # Increment comment count
        Post.objects.filter(pk=post_id).update(comment_count=F('comment_count') + 1)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/comments/:id/ - Get comment
    PATCH /api/comments/:id/ - Update comment
    DELETE /api/comments/:id/ - Delete comment
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Comment.objects.select_related('user')
    
    def perform_destroy(self, instance):
        # Only comment owner can delete
        if instance.user != self.request.user:
            return Response(
                {'error': 'You can only delete your own comments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Decrement comment count
        Post.objects.filter(pk=instance.post.pk).update(
            comment_count=F('comment_count') - 1
        )
        instance.delete()


class FeedView(generics.ListAPIView):
    """
    GET /api/feed/ - Get personalized feed
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # For now, return all posts. Later we'll filter by following
        return Post.objects.select_related('user').all()
    
    def get_serializer_context(self):
        return {'request': self.request}

class StoryListCreateView(generics.ListCreateAPIView):
    """
    GET /api/stories/ - List all active stories from followed users
    POST /api/stories/ - Create new story
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StoryCreateSerializer
        return StorySerializer
    
    def get_queryset(self):
        # Get stories from users the current user follows (including own stories)
        from social.models import Follow
        
        following_ids = Follow.objects.filter(
            follower=self.request.user
        ).values_list('following', flat=True)
        
        # Include own stories + stories from followed users
        user_ids = list(following_ids) + [self.request.user.id]
        
        # Only return non-expired stories
        queryset = Story.objects.filter(
            user_id__in=user_ids,
            expires_at__gt=timezone.now()
        ).select_related('user')
        
        print(f"User {self.request.user.username} following: {list(following_ids)}")  # Debug
        print(f"Stories found: {queryset.count()}")  # Debug
        
        return queryset
    
    def perform_create(self, serializer):
        story = serializer.save(user=self.request.user)
        print(f"Story created by {self.request.user.username}, expires at {story.expires_at}")  # Debug
      
    
    def get_serializer_context(self):
        return {'request': self.request}


class UserStoriesView(generics.ListAPIView):
    """GET /api/users/:username/stories/ - Get user's active stories"""
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        username = self.kwargs['username']
        return Story.objects.filter(
            user__username=username,
            expires_at__gt=timezone.now()
        ).select_related('user')
    
    def get_serializer_context(self):
        return {'request': self.request}


class StoryDetailView(generics.RetrieveDestroyAPIView):
    """
    GET /api/stories/:id/ - Get story details
    DELETE /api/stories/:id/ - Delete own story
    """
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Story.objects.select_related('user').all()
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You can only delete your own stories'},
                status=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarkStoryViewedView(APIView):
    """POST /api/stories/:id/view/ - Mark story as viewed"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        story = get_object_or_404(Story, pk=pk)
        
        # Don't count views on own stories
        if story.user == request.user:
            return Response({
                'message': 'Cannot view own story'
            }, status=status.HTTP_200_OK)
        
        # Create or get view
        view, created = StoryView.objects.get_or_create(
            story=story,
            user=request.user
        )
        
        return Response({
            'message': 'Story marked as viewed',
            'viewed': True
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class DeleteExpiredStoriesView(APIView):
    """DELETE /api/stories/cleanup/ - Delete expired stories (admin only)"""
    permission_classes = [permissions.IsAdminUser]
    
    def delete(self, request):
        expired_stories = Story.objects.filter(expires_at__lte=timezone.now())
        count = expired_stories.count()
        expired_stories.delete()
        
        return Response({
            'message': f'Deleted {count} expired stories'
        }, status=status.HTTP_200_OK)