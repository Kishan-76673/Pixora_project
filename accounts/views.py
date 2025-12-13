from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import threading
from datetime import datetime, timedelta
from django.utils import timezone


from .models import EmailOTP
from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    UserSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer, 
    SendOTPSerializer, 
    VerifyOTPSerializer
)

User = get_user_model()

# Temporary: Update views.py to debug email
def send_otp_email_background(email, otp_code):
    """Send OTP email in background thread"""
    try:
        subject = 'Welcome to Pixora! Verify Your Account'
        
        # Beautiful HTML email template
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pixora Verification</title>
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    background-color: #f8f9fa;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 10px;
                    padding: 30px; 
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 20px;
                    text-align: center;
                    color: white;
                }}
                .logo {{
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }}
                .otp-container {{
                    padding: 40px 20px;
                    text-align: center;
                }}
                .otp-code {{
                    font-size: 42px;
                    font-weight: bold;
                    letter-spacing: 10px;
                    color: #667eea;
                    background: #f3f4f6;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 30px auto;
                    display: inline-block;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">📸 PIXORA</div>
                    <p style="margin: 0; opacity: 0.9;">Share Your Creative Moments</p>
                </div>
                
                <div class="otp-container">
                    <h2>Welcome to Pixora! 🎉</h2>
                    <p>Enter this verification code to complete your registration:</p>
                    
                    <div class="otp-code">{otp_code}</div>
                    
                    <p style="color: #6b7280;">
                        This code will expire in <strong>5 minutes</strong>.<br>
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
                
                <div class="footer">
                    <p>© {datetime.now().year} Pixora. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version (fallback)
        plain_message = f"""
        Welcome to Pixora!
        
        Your verification code is: {otp_code}
        
        This code will expire in 5 minutes.
        
        Enter this code on the verification page to complete your registration.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        The Pixora Team
        """
        print(f"\n=== TRYING TO SEND EMAIL ===")
        print(f"To: {email}")
        print(f"From: {settings.DEFAULT_FROM_EMAIL}")
        print(f"Using: {settings.EMAIL_HOST_USER}")
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"✅ Email sent successfully to {email}")
        print("=========================\n")
        
    except Exception as e:
        print(f"❌ Email failed: {str(e)}")
        print(f"Error: {str(e)}")
        print(f"Email host: {settings.EMAIL_HOST}")
        print(f"Email port: {settings.EMAIL_PORT}")
        print(f"=========================\n")


class SendOTPView(APIView):
    """POST /api/auth/send-otp/ - Send OTP to email"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()

        # Validate email format
        if not email.endswith(('.com', '.in')):
            return Response(
                {'error': 'Email must end with .com or .in'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Rate limiting: Check recent OTP requests
        recent_attempts = EmailOTP.objects.filter(
            email=email,
            created_at__gte=timezone.now() - timedelta(minutes=1)
        ).count()
        
        if recent_attempts >= 2:
            return Response(
                {'error': 'Too many OTP requests. Please wait 1 minute.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Invalidate old OTPs
        EmailOTP.objects.filter(email=email, is_verified=False).delete()
        
        # Generate new OTP
        otp_code = EmailOTP.generate_otp()
        otp_instance = EmailOTP.objects.create(
            email=email,
            otp=otp_code
        )
        
       # Send email with OTP in background thread
        try:
            if settings.DEBUG:
                print(f"\n{'='*50}")
                print(f"OTP for {email}: {otp_code}")
                print(f"{'='*50}\n")
            
            # Send email in background
            email_thread = threading.Thread(
                target=send_otp_email_background,
                args=(email, otp_code)
            )
            email_thread.start()
            
            return Response({
                'message': 'OTP sent successfully to your email',
                'email': email,
                'expires_in': 300  # 5 minutes
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
class VerifyOTPView(APIView):
    """Verify OTP and mark email as verified"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()
        otp = serializer.validated_data['otp']
        
        # Clean up expired OTPs
        EmailOTP.objects.filter(
            expires_at__lt=timezone.now(),
            is_verified=False
        ).delete()

        try:
            otp_instance = EmailOTP.objects.get(
                email=email,
                otp=otp,
                is_verified=False
            )
            
            if not otp_instance.is_valid():
                return Response(
                    {'error': 'OTP has expired. Please request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark OTP as verified
            otp_instance.is_verified = True
            otp_instance.save()
            
            return Response({
                'message': 'Email verified successfully',
                'verified': True,
                'email': email
            }, status=status.HTTP_200_OK)
            
        except EmailOTP.DoesNotExist:
            # Check if OTP was already verified
            if EmailOTP.objects.filter(email=email, is_verified=True).exists():
                return Response({
                    'message': 'Email already verified',
                    'verified': True,
                    'email': email
                }, status=status.HTTP_200_OK)
            return Response(
                {'error': 'Invalid OTP'},
                status=status.HTTP_400_BAD_REQUEST
            )

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}") 
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()
        username = serializer.validated_data['username']

        print(f"Checking registration for email: {email}, username: {username}")  # Debug

        # Check if email is verified
        verified_otp = EmailOTP.objects.filter(
            email=email,
            is_verified=True
        ).exists()
        
        if not verified_otp:
            return Response(
                {'error': 'Please verify your email first by entering the OTP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Check if user already exists (race condition protection)
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already taken'},
                status=status.HTTP_400_BAD_REQUEST
            )


        # Create user
        try:
            user = serializer.save()
            user.is_verified = True
            user.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

            # Set user info in token
            access_token['username'] = user.username
            access_token['email'] = user.email

            # Send welcome email
            self.send_welcome_email(user.email, user.username)
            return Response({
                'user': UserSerializer(user, context={'request': request}).data,
                'access': str(access_token),
                'refresh': str(refresh),
                'message': 'Registration successful!'
            }, status=status.HTTP_201_CREATED)          

        except Exception as e:
            return Response(
                {'error': f'Registration failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def send_welcome_email(self, email, username):
        """Send welcome email after registration"""
        try:
            subject = 'Welcome to Pixora! 🎉'
        
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ text-align: center; padding: 20px 0; }}
                    .logo {{ font-size: 32px; font-weight: bold; color: #6366f1; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 10px; }}
                    .button {{ display: inline-block; background: #6366f1; color: white; 
                               padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                               margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">📸 PIXORA</div>
                    </div>
                    <div class="content">
                        <h2>Welcome @{username}! 👋</h2>
                        <p>Your account has been successfully created and verified.</p>
                        <p>Start exploring Pixora by:</p>
                        <ul>
                            <li>Setting up your profile</li>
                            <li>Following interesting accounts</li>
                            <li>Sharing your first post</li>
                        </ul>
                        <p>
                            <a href="http://localhost:3000/" class="button">
                                Go to Dashboard
                            </a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """          

            plain_message = f"""
            Welcome to Pixora, @{username}!     
            Your account has been successfully created and verified.         
            Start exploring:
            - Set up your profile
            - Follow interesting accounts
            - Share your first post      
            Login here: http://localhost:/dashboard           

            Best regards,
            The Pixora Team
            """           

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pixora.com'),
                recipient_list=[email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send welcome email: {str(e)}")


class LoginView(APIView):
    """POST /api/auth/login/"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """GET /api/auth/me/"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class UserProfileView(generics.RetrieveAPIView):
    """
    GET /api/users/:username/ - Get user profile
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'username'
    queryset = User.objects.all()
    
    def get_serializer_context(self):
        return {'request': self.request}

class UpdateProfileView(generics.UpdateAPIView):
    """
    PATCH /api/auth/me/ - Update own profile
    """
    serializer_class = UpdateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return updated profile
        profile_serializer = UserProfileSerializer(instance, context={'request': request})
        
        return Response({
            'message': 'Profile updated successfully',
            'user': profile_serializer.data
        }, status=status.HTTP_200_OK)