from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max, Count
from .models import Conversation, Message, MessageRead
from .serializers import (
    ConversationSerializer, 
    MessageSerializer,
    CreateConversationSerializer
)


class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing conversations"""
    
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get conversations for current user"""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages').distinct()
    
    @action(detail=False, methods=['post'])
    def create_or_get(self, request):
        """Create new conversation or get existing one"""
        serializer = CreateConversationSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        
        return Response(
            ConversationSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages for a conversation with pagination"""
        conversation = self.get_object()
        
        # Verify user is participant
        if request.user not in conversation.participants.all():
            return Response(
                {'error': 'You are not a participant in this conversation'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get messages
        messages = Message.objects.filter(
            conversation=conversation,
            is_deleted=False
        ).select_related('sender').prefetch_related('read_receipts')
        
        # Pagination
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(
                page,
                many=True,
                context={'request': request}
            )
            return self.get_paginated_response(serializer.data)
        
        serializer = MessageSerializer(
            messages,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        conversation = self.get_object()
        
        # Get unread messages
        unread_messages = Message.objects.filter(
            conversation=conversation,
            is_deleted=False
        ).exclude(sender=request.user).exclude(
            read_receipts__user=request.user
        )
        
        # Mark as read
        for message in unread_messages:
            MessageRead.objects.get_or_create(
                message=message,
                user=request.user
            )
        
        return Response(
            {'message': f'{unread_messages.count()} messages marked as read'},
            status=status.HTTP_200_OK
        )


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing messages"""
    
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get messages for current user's conversations"""
        return Message.objects.filter(
            conversation__participants=self.request.user,
            is_deleted=False
        ).select_related('sender', 'conversation')
    
    def perform_create(self, serializer):
        """Create message with current user as sender"""
        serializer.save(sender=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a specific message as read"""
        message = self.get_object()
        
        MessageRead.objects.get_or_create(
            message=message,
            user=request.user
        )
        
        return Response(
            {'message': 'Message marked as read'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['delete'])
    def soft_delete(self, request, pk=None):
        """Soft delete a message"""
        message = self.get_object()
        
        # Only sender can delete
        if message.sender != request.user:
            return Response(
                {'error': 'You can only delete your own messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message.is_deleted = True
        message.save()
        
        return Response(
            {'message': 'Message deleted'},
            status=status.HTTP_200_OK
        )