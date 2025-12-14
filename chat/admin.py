from django.contrib import admin
from .models import Conversation, Message, MessageRead


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation_type', 'created_at', 'get_participants']
    list_filter = ['conversation_type', 'created_at']
    search_fields = ['participants__username']
    
    def get_participants(self, obj):
        return ", ".join([p.username for p in obj.participants.all()])
    get_participants.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'conversation', 'message_type', 'created_at', 'is_deleted']
    list_filter = ['message_type', 'is_deleted', 'created_at']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MessageRead)
class MessageReadAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'read_at']
    list_filter = ['read_at']
    search_fields = ['user__username']