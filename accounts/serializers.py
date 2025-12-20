from django.contrib.auth import authenticate
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User
from .models import EmailOTP
from social.models import Follow
from django.contrib.auth.password_validation import validate_password
import re
User = get_user_model() 

class SendOTPSerializer(serializers.Serializer):
    """Serializer for sending OTP"""
    email = serializers.EmailField()

class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    avatar_url = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'bio', 'avatar','avatar_url', 'role', 'is_verified', 'post_count', 'follower_count', 'following_count', 'created_at']
        read_only_fields = ['id', 'username', 'email', 'role', 'is_verified', 'created_at']
    def get_avatar_url(self, obj):
        """Get full avatar URL"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
        return None

    def get_post_count(self, obj):
        return obj.posts.count()
    
    def get_follower_count(self, obj):
        # Count users who follow this user
        
        return Follow.objects.filter(following=obj).count()
    
    def get_following_count(self, obj):
        return Follow.objects.filter(follower=obj).count()


class UserProfileSerializer(serializers.ModelSerializer):
    """Detailed user profile serializer with counts"""
    
    avatar_url = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'bio', 
            'avatar', 'avatar_url', 'role', 'is_verified',
            'post_count', 'follower_count', 'following_count',
            'created_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'is_verified', 'created_at']
    
    def get_avatar_url(self, obj):
        """Get full avatar URL"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
        return None
    
    def get_post_count(self, obj):
        """Get user's post count"""
        return obj.posts.count()

    def get_follower_count(self, obj):
        from social.models import Follow
        count = Follow.objects.filter(following=obj).count()
        print(f"🔍 Getting follower_count for {obj.username}: {count}")
        return count

    def get_following_count(self, obj):
        from social.models import Follow
        count = Follow.objects.filter(follower=obj).count()
        print(f"🔍 Getting following_count for {obj.username}: {count}")
        return count

class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = User
        fields = ['full_name', 'bio', 'avatar']
    
    def validate_avatar(self, value):
        """Validate avatar file"""
        if value:
            # Max 5MB
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Avatar size cannot exceed 5MB")
            
            # Check file type
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("Avatar must be an image file")
        
        return value

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'}, required=True )
    confirmPassword = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    class Meta:
        model = User
        fields = ['email', 'username', 'full_name', 'password', 'confirmPassword']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
            'full_name': {'required': False},
        }

    
    def validate_email(self, value):
        value = value.lower()
        # Check email domain
        if not value.endswith(('.com', '.in')):
            raise serializers.ValidationError("Email must end with .com or .in")

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")

        return value
    
    def validate_username(self, value):
        # Username validation rules
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long")
        
        if len(value) > 30:
            raise serializers.ValidationError("Username must be less than 30 characters")
        
        # Allow only alphanumeric and underscores
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores")
        
        # Check if username exists
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken")
        
        return value

    def create(self, validated_data):
        # Create user with validated data
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            full_name=validated_data.get('full_name', ''),
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            
            if not user:
                raise serializers.ValidationError("Invalid email or password")
            
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled")
            
            data['user'] = user
            return data
        else:
            raise serializers.ValidationError("Must include email and password")
