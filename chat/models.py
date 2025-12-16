from django.db import models
from django.conf import settings
import uuid

class Conversation(models.Model):
    """Model for chat conversations (1-to-1 for now)"""
    
    CONVERSATION_TYPES = [
        ('direct', 'Direct Message'),
        ('group', 'Group Chat'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations'
    )
    conversation_type = models.CharField(
        max_length=10,
        choices=CONVERSATION_TYPES,
        default='direct'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_conversations'
        ordering = ['-updated_at']
    
    def __str__(self):
        participant_names = ', '.join([p.username for p in self.participants.all()])
        return f"Conversation: {participant_names}"
    
    @property
    def last_message(self):
        """Get the last message in conversation"""
        return self.messages.order_by('-created_at').first()


class Message(models.Model):
    """Model for chat messages"""
    
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('file', 'File'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True, null=True)
    message_type = models.CharField(
        max_length=10,
        choices=MESSAGE_TYPES,
        default='text'
    )
    file = models.FileField(
        # upload_to='chat_files/%Y/%m/',
        upload_to='chat_files/',
        blank=True,
        null=True
    )
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies'
    )
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', '-created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"


class MessageRead(models.Model):
    """Track message read receipts"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='read_receipts'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_message_reads'
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['message', 'user']),
        ]
    
    def __str__(self):
        return f"{self.user.username} read message at {self.read_at}"

class MessageReaction(models.Model):
    """Model for message reactions (emojis)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='reactions'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_message_reactions'
        unique_together = ['message', 'user', 'emoji']
        indexes = [
            models.Index(fields=['message', 'emoji']),
        ]
    
    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} to message"
