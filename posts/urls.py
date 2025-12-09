from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    # Posts
    path('posts/', views.PostListCreateView.as_view(), name='post_list_create'),
    path('posts/<uuid:pk>/', views.PostDetailView.as_view(), name='post_detail'),
    path('users/<str:username>/posts/', views.UserPostsView.as_view(), name='user_posts'),
    
    # Feed
    path('feed/', views.FeedView.as_view(), name='feed'),
    
    # Likes
    path('posts/<uuid:pk>/like/', views.LikePostView.as_view(), name='like_post'),
    
    # Comments
    path('posts/<uuid:post_id>/comments/', views.CommentListCreateView.as_view(), name='comment_list_create'),
    path('comments/<uuid:pk>/', views.CommentDetailView.as_view(), name='comment_detail'),

    
    # Stories
    path('stories/', views.StoryListCreateView.as_view(), name='story_list_create'),
    path('stories/<uuid:pk>/', views.StoryDetailView.as_view(), name='story_detail'),
    path('stories/<uuid:pk>/view/', views.MarkStoryViewedView.as_view(), name='mark_story_viewed'),
    path('stories/cleanup/', views.DeleteExpiredStoriesView.as_view(), name='delete_expired_stories'),
    path('users/<str:username>/stories/', views.UserStoriesView.as_view(), name='user_stories'),
]
