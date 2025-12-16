from rest_framework import serializers
from .models import Conversation, Message, MessageRead
from accounts.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageReadSerializer(serializers.ModelSerializer):
    """Serializer for message read receipts"""
    
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = MessageRead
        fields = ['id', 'user', 'read_at']

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    
    sender = UserSerializer(read_only=True)
    reply_to = serializers.SerializerMethodField()
    read_receipts = MessageReadSerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content', 
            'message_type', 'file', 'file_url', 'reply_to',
            'is_deleted', 'created_at', 'read_receipts', 'is_read'
        ]
        read_only_fields = ['id', 'sender', 'created_at']
    
    def get_file_url(self, obj):
        """Get full file URL"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_reply_to(self, obj):
        """Get replied message details"""
        if obj.reply_to:
            return {
                'id': str(obj.reply_to.id),
                'content': obj.reply_to.content,
                'sender': obj.reply_to.sender.username,
                'message_type': obj.reply_to.message_type
            }
        return None
    def to_representation(self, instance):
        """Convert UUIDs to strings for JSON serialization"""
        data = super().to_representation(instance)
        # Convert UUID fields to strings
        data['id'] = str(instance.id)
        data['conversation'] = str(instance.conversation.id)
        data['sender']['id'] = str(instance.sender.id)
        if instance.reply_to:
            data['reply_to']['id'] = str(instance.reply_to.id)
        return data
            
    def get_is_read(self, obj):
        """Check if current user has read the message"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return MessageRead.objects.filter(
                message=obj,
                user=request.user
            ).exists()
        return False
    
    def validate_file(self, value):
        """Validate uploaded file"""
        if value:
            # Max 10MB
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("File size cannot exceed 10MB")
            
            # Validate file type based on message_type
            message_type = self.initial_data.get('message_type', 'text')
            
            if message_type == 'image':
                if not value.content_type.startswith('image/'):
                    raise serializers.ValidationError("File must be an image")
            elif message_type == 'video':
                if not value.content_type.startswith('video/'):
                    raise serializers.ValidationError("File must be a video")
        
        return value


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations"""
    
    participants = UserSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'conversation_type', 
            'last_message', 'unread_count', 'other_user',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Get all messages in this conversation
            message_ids = obj.messages.exclude(sender=request.user).values_list('id', flat=True)
            
            # Count messages not read by current user
            read_message_ids = MessageRead.objects.filter(
                message_id__in=message_ids,
                user=request.user
            ).values_list('message_id', flat=True)
            
            return len(message_ids) - len(read_message_ids)
        return 0
    
    def get_other_user(self, obj):
        """Get the other user in direct conversation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and obj.conversation_type == 'direct':
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user:
                return UserSerializer(other_user, context={'request': request}).data
        return None


class CreateConversationSerializer(serializers.Serializer):
    """Serializer for creating a new conversation"""
    
    participant_id = serializers.UUIDField()
    
    def validate_participant_id(self, value):
        """Validate that participant exists"""
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        return value
    
    def create(self, validated_data):
        """Create or get existing conversation"""
        current_user = self.context['request'].user
        other_user_id = validated_data['participant_id']
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            conversation_type='direct',
            participants=current_user
        ).filter(
            participants__id=other_user_id
        ).distinct().first()
        
        if existing_conversation:
            return existing_conversation
        
        # Create new conversation
        conversation = Conversation.objects.create(conversation_type='direct')
        conversation.participants.add(current_user, other_user_id)
        
        return conversation