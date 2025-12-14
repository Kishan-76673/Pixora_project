import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message, MessageRead
from .serializers import MessageSerializer
from rest_framework.request import Request
from django.test import RequestFactory

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope['user']
        
        # Reject if not authenticated
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Join user's personal room
        self.user_room = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_room,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to chat server'
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_room'):
            await self.channel_layer.group_discard(
                self.user_room,
                self.channel_name
            )
        
        if hasattr(self, 'conversation_room'):
            await self.channel_layer.group_discard(
                self.conversation_room,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'join_conversation':
                await self.join_conversation(data)
            
            elif message_type == 'leave_conversation':
                await self.leave_conversation(data)
            
            elif message_type == 'send_message':
                await self.send_chat_message(data)
            
            elif message_type == 'typing':
                await self.handle_typing(data)
            
            elif message_type == 'mark_as_read':
                await self.mark_message_read(data)
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def join_conversation(self, data):
        """Join a conversation room"""
        conversation_id = data.get('conversation_id')
        
        # Verify user is participant
        is_participant = await self.check_participant(conversation_id)
        if not is_participant:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are not a participant in this conversation'
            }))
            return
        
        # Leave previous conversation if any
        if hasattr(self, 'conversation_room'):
            await self.channel_layer.group_discard(
                self.conversation_room,
                self.channel_name
            )
        
        # Join new conversation
        self.conversation_room = f"conversation_{conversation_id}"
        await self.channel_layer.group_add(
            self.conversation_room,
            self.channel_name
        )
        
        await self.send(text_data=json.dumps({
            'type': 'joined_conversation',
            'conversation_id': conversation_id
        }))
    
    async def leave_conversation(self, data):
        """Leave a conversation room"""
        if hasattr(self, 'conversation_room'):
            await self.channel_layer.group_discard(
                self.conversation_room,
                self.channel_name
            )
            delattr(self, 'conversation_room')
    
    async def send_chat_message(self, data):
        """Handle sending a chat message"""
        conversation_id = data.get('conversation_id')
        content = data.get('content', '').strip()
        reply_to_id = data.get('reply_to')
        
        if not content:
            return
        
        # Save message to database
        message = await self.save_message(
            conversation_id=conversation_id,
            content=content,
            reply_to_id=reply_to_id
        )
        
        if message:
            # Serialize message
            message_data = await self.serialize_message(message)
            
            # Send to conversation room
            await self.channel_layer.group_send(
                f"conversation_{conversation_id}",
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )
    
    async def handle_typing(self, data):
        """Handle typing indicator"""
        conversation_id = data.get('conversation_id')
        is_typing = data.get('is_typing', False)
        
        # Broadcast typing status to conversation
        await self.channel_layer.group_send(
            f"conversation_{conversation_id}",
            {
                'type': 'typing_indicator',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'is_typing': is_typing
            }
        )
    
    async def mark_message_read(self, data):
        """Mark message as read"""
        message_id = data.get('message_id')
        
        await self.create_read_receipt(message_id)
        
        # Notify sender
        message = await self.get_message(message_id)
        if message:
            await self.channel_layer.group_send(
                f"user_{message.sender.id}",
                {
                    'type': 'message_read',
                    'message_id': str(message_id),
                    'user_id': str(self.user.id),
                    'username': self.user.username
                }
            )
    
    # Event handlers
    async def chat_message(self, event):
        """Send message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
    
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        # Don't send typing indicator to self
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            }))
    
    async def message_read(self, event):
        """Send read receipt to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message_read',
            'message_id': event['message_id'],
            'user_id': event['user_id'],
            'username': event['username']
        }))
    
    # Database operations
    @database_sync_to_async
    def check_participant(self, conversation_id):
        """Check if user is participant in conversation"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return self.user in conversation.participants.all()
        except Conversation.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, conversation_id, content, reply_to_id=None):
        """Save message to database"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            reply_to = None
            if reply_to_id:
                try:
                    reply_to = Message.objects.get(id=reply_to_id)
                except Message.DoesNotExist:
                    pass
            
            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                content=content,
                reply_to=reply_to
            )
            
            # Update conversation timestamp
            conversation.save()
            
            return message
        except Conversation.DoesNotExist:
            return None
    
    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message for WebSocket"""
        factory = RequestFactory()
        request = factory.get('/')
        request.user = self.user
        
        serializer = MessageSerializer(message, context={'request': request})
        return serializer.data
    
    @database_sync_to_async
    def get_message(self, message_id):
        """Get message by ID"""
        try:
            return Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return None
    
    @database_sync_to_async
    def create_read_receipt(self, message_id):
        """Create read receipt for message"""
        try:
            message = Message.objects.get(id=message_id)
            MessageRead.objects.get_or_create(
                message=message,
                user=self.user
            )
        except Message.DoesNotExist:
            pass