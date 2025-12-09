from django.contrib.auth import authenticate
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User
# from .models import Follow 
from social.models import Follow
import re
User = get_user_model()

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
    follower_count = serializers.IntegerField(default=0, read_only=True)
    following_count = serializers.IntegerField(default=0, read_only=True)
    
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
    
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'username', 'full_name', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    def validate(self, data):
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        # Strong Rules
        validate_email_rules(email)
        validate_username_rules(username)
        validate_password_strength(password)

        return data
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value.lower()
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken")
        if not value.replace('_', '').isalnum():
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores")
        
        return value.lower()

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data) 
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

def validate_password_strength(password):
    if len(password) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise serializers.ValidationError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise serializers.ValidationError("Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise serializers.ValidationError("Password must contain at least one special character.")

def validate_username_rules(username):
    if len(username) < 8:
        raise serializers.ValidationError("Username must be at least 8 characters long.")
    if not re.search(r"[A-Z]", username):
        raise serializers.ValidationError("Username must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", username):
        raise serializers.ValidationError("Username must contain at least one lowercase letter.")
    if not re.search(r"\d", username):
        raise serializers.ValidationError("Username must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", username):
        raise serializers.ValidationError("Username must contain at least one special character.")

def validate_email_rules(email):
    if not re.match(r"^[\w\.-]+@[\w\.-]+\.(com|in)$", email):
        raise serializers.ValidationError("Email must contain @ and end with .com or .in")





