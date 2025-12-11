from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # OTP - ADD THESE
    path('auth/send-otp/', views.SendOTPView.as_view(), name='send_otp'),
    path('auth/verify-otp/', views.VerifyOTPView.as_view(), name='verify_otp'),
    
    # Current User
    path('auth/me/', views.CurrentUserView.as_view(), name='current_user'),
    
    # Profile
    path('users/<str:username>/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', views.UpdateProfileView.as_view(), name='update_profile'),
]