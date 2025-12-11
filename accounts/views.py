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


# # Email sending in background thread
# def send_otp_email_background(email, otp_code):
#     """Send OTP email in background thread"""
#     try:
#         subject = 'Verify Your Pixora Account - OTP Code'
        
#         # For development - use simple template if file doesn't exist
#         try:
#             html_message = render_to_string('accounts/templates/email/otp_email.html', {
#                 'otp_code': otp_code,
#                 'current_year': datetime.now().year
#             })
#         except:
#             # Fallback HTML if template doesn't exist
#             html_message = f"""
#             <html>
#             <body>
#                 <h2>Pixora Verification Code</h2>
#                 <p>Your OTP: <strong>{otp_code}</strong></p>
#                 <p>Valid for 5 minutes</p>
#             </body>
#             </html>
#             """
        
#         # Plain text version
#         plain_message = f"""
#         Welcome to Pixora!
        
#         Your verification code is: {otp_code}
        
#         This code will expire in 5 minutes.
        
#         If you didn't request this code, please ignore this email.
        
#         Best regards,
#         The Pixora Team
#         """
        
#         # Only send actual email if not in debug mode
#         if not settings.DEBUG:
#             send_mail(
#                 subject=subject,
#                 message=plain_message,
#                 from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pixora.com'),
#                 recipient_list=[email],
#                 html_message=html_message,
#                 fail_silently=False,
#             )
#             print(f"OTP email sent to {email}")
#         else:
#             print(f"\n{'='*60}")
#             print(f"DEBUG MODE: OTP for {email}: {otp_code}")
#             print(f"Email would be sent with subject: {subject}")
#             print(f"{'='*60}\n")
            
#     except Exception as e:
#         print(f"Failed to send email to {email}: {str(e)}")

# Temporary: Update views.py to debug email
def send_otp_email_background(email, otp_code):
    """Send OTP email in background thread"""
    try:
        subject = 'Verify Your Pixora Account - OTP Code'
        
        # Simple email for testing
        html_message = f"<h2>Your OTP: {otp_code}</h2>"
        plain_message = f"Your OTP: {otp_code}"
        
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
        
        print(f"Email sent successfully to {email}")
        print("=========================\n")
        
    except Exception as e:
        print(f"\n=== EMAIL SEND FAILED ===")
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
            # For development, show OTP in console
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
    
    # def send_otp_email(self, email, otp_code):
    #     """Send OTP email to user"""
    #     subject = 'Verify Your Pixora Account - OTP Code'
        
    #     # HTML email body
    #     html_message = f"""
    #     <!DOCTYPE html>
    #     <html>
    #     <head>
    #         <style>
    #             body {{
    #                 font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    #                 line-height: 1.6;
    #                 color: #333;
    #                 max-width: 600px;
    #                 margin: 0 auto;
    #                 background-color: #f4f4f4;
    #             }}
    #             .container {{
    #                 background-color: #ffffff;
    #                 padding: 40px;
    #                 border-radius: 10px;
    #                 box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    #                 margin: 20px;
    #             }}
    #             .header {{
    #                 text-align: center;
    #                 padding-bottom: 20px;
    #                 border-bottom: 3px solid #6366f1;
    #             }}
    #             .logo {{
    #                 font-size: 32px;
    #                 font-weight: bold;
    #                 color: #6366f1;
    #                 margin-bottom: 10px;
    #             }}
    #             .title {{
    #                 font-size: 24px;
    #                 color: #1f2937;
    #                 margin: 20px 0;
    #             }}
    #             .otp-box {{
    #                 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    #                 color: white;
    #                 padding: 30px;
    #                 text-align: center;
    #                 border-radius: 8px;
    #                 margin: 30px 0;
    #             }}
    #             .otp-code {{
    #                 font-size: 36px;
    #                 font-weight: bold;
    #                 letter-spacing: 8px;
    #                 margin: 10px 0;
    #             }}
    #             .info-text {{
    #                 color: #6b7280;
    #                 font-size: 14px;
    #                 margin: 15px 0;
    #             }}
    #             .warning {{
    #                 background-color: #fef3c7;
    #                 border-left: 4px solid #f59e0b;
    #                 padding: 15px;
    #                 margin: 20px 0;
    #                 border-radius: 4px;
    #             }}
    #             .footer {{
    #                 text-align: center;
    #                 padding-top: 30px;
    #                 border-top: 1px solid #e5e7eb;
    #                 color: #9ca3af;
    #                 font-size: 12px;
    #                 margin-top: 30px;
    #             }}
    #             .button {{
    #                 display: inline-block;
    #                 background-color: #6366f1;
    #                 color: white;
    #                 padding: 12px 30px;
    #                 text-decoration: none;
    #                 border-radius: 6px;
    #                 margin: 20px 0;
    #             }}
    #         </style>
    #     </head>
    #     <body>
    #         <div class="container">
    #             <div class="header">
    #                 <div class="logo">📸 PIXORA</div>
    #                 <p style="color: #6b7280; margin: 0;">Share Your Moments, Connect Your World</p>
    #             </div>
                
    #             <h2 class="title">Welcome to Pixora! 🎉</h2>
                
    #             <p>Thank you for joining our creative community! To complete your registration and verify your email address, please use the OTP code below:</p>
                
    #             <div class="otp-box">
    #                 <p style="margin: 0; font-size: 14px;">Your Verification Code</p>
    #                 <div class="otp-code">{otp_code}</div>
    #                 <p style="margin: 0; font-size: 12px; opacity: 0.9;">Valid for 5 minutes</p>
    #             </div>
                
    #             <p class="info-text">
    #                 <strong>What's next?</strong><br>
    #                 Enter this code on the verification page to activate your account and start sharing your creative moments with the Pixora community.
    #             </p>
                
    #             <div class="warning">
    #                 <strong>⚠️ Security Notice:</strong><br>
    #                 • Never share this code with anyone<br>
    #                 • Pixora staff will never ask for your OTP<br>
    #                 • This code expires in 5 minutes<br>
    #                 • If you didn't request this, please ignore this email
    #             </div>
                
    #             <p class="info-text">
    #                 Having trouble? Contact our support team at <a href="mailto:support@pixora.com">support@pixora.com</a>
    #             </p>
                
    #             <div class="footer">
    #                 <p>© 2024 Pixora. All rights reserved.</p>
    #                 <p>This is an automated message, please do not reply to this email.</p>
    #             </div>
    #         </div>
    #     </body>
    #     </html>
    #     """
        
    #     # Plain text version
    #     plain_message = f"""
    #     Welcome to Pixora!
        
    #     Your verification code is: {otp_code}
        
    #     This code will expire in 5 minutes.
        
    #     If you didn't request this code, please ignore this email.
        
    #     Best regards,
    #     The Pixora Team
    #     """
        
    #     send_mail(
    #         subject=subject,
    #         message=plain_message,
    #         from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@pixora.com',
    #         recipient_list=[email],
    #         html_message=html_message,
    #         fail_silently=False,
    #     )


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

# def get_tokens_for_user(user):
#     """Generate JWT tokens for user"""
#     refresh = RefreshToken.for_user(user)
#     return {
#         'refresh': str(refresh),
#         'access': str(refresh.access_token),
#     }

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()
        
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
                'message': 'Registration successful! Redirecting to dashboard...'
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
                            <a href="http://localhost:5173/dashboard" class="button">
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
            Login here: http://localhost:5173/dashboard           

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
    # def get(self, request):
    #     serializer = UserProfileSerializer(request.user, context={'request': request})
    #     return Response(serializer.data, status=status.HTTP_200_OK)

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