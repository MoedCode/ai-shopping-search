# ai-shopping-search/backend/chat/serializers.py
from rest_framework import serializers
from .models import ChatSession, ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'role', 'content', 'metadata', 'created_at', 'status', 'external_id', 'feedback'
            ]

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'messages', 'last_message_at']
class ChatSessionSummarySerializer(serializers.ModelSerializer):
    """
    Used for listing sessions in the Sidebar (lightweight, no messages).
    """
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'updated_at', 'created_at']