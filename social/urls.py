from django.urls import path
from . import views
from .views import FollowersListView, FollowingListView
app_name = 'social'

urlpatterns = [
    # Follow/Unfollow
    path('users/<str:username>/follow/', views.FollowUserView.as_view(), name='follow_user'),
    path('users/<str:username>/follow/status/', views.CheckFollowStatusView.as_view(), name='follow_status'),
    
    # Followers/Following lists
    path('users/<str:username>/followers/', views.FollowerListView.as_view(), name='followers'),
    path('users/<str:username>/following/', views.FollowingListView.as_view(), name='following'),

    path('users/<str:username>/followers/', FollowersListView.as_view()),
    path('users/<str:username>/following/', FollowingListView.as_view()),
]