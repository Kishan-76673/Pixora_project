from django.db import models
from django.conf import settings
import uuid

User = settings.AUTH_USER_MODEL

class Post(models.Model):
    """Post model for images and videos"""
    
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'), 
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    
    caption = models.TextField(max_length=2200, blank=True)
    media = models.FileField(upload_to='posts/')  
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='image')
    
    # Cached counts
    like_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"Post by {self.user.username} - {self.created_at}"


class Like(models.Model):
    """Like model for posts"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'likes'
        unique_together = ['user', 'post']
        indexes = [
            models.Index(fields=['post', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} liked {self.post.id}"


class Comment(models.Model):
    """Comment model"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=500)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', '-created_at']),
        ]
    
    def __str__(self):
        return f"Comment by {self.user.username}"

# Add this to your existing posts/models.py

class Story(models.Model):
    """Story model - 24-hour disappearing content"""
    
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    
    media = models.FileField(upload_to='stories/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    
    class Meta:
        db_table = 'stories'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def save(self, *args, **kwargs):
        # Set expiry to 24 hours from now
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            # self.expires_at = timezone.now() + timedelta(hours=24)
            self.expires_at = timezone.now() + timedelta(minutes=5) 
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Story by {self.user.username} - {self.created_at}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


class StoryView(models.Model):
    """Track who viewed stories"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_views')
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'story_views'
        unique_together = ['story', 'user']
        indexes = [
            models.Index(fields=['story', '-viewed_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} viewed story {self.story.id}"