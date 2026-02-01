#ai-shopping-search/backend/chat/models.py
from django.db import models
from common.models import BaseModel

class ChatSession(BaseModel):
    """
    Container for the conversation context.
    Linked strictly to the Unified User model.
    """
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='chat_sessions', # FIX: Logic correction
        null=True,
        blank=True
    )

    title = models.CharField(max_length=255)

    def __str__(self):
        return f"ChatSession {self.title}"

class ChatMessage(BaseModel):
    """
    Unified model for messages sent by the user or the AI agent.
    """

    session = models.ForeignKey(
        'chat.ChatSession',
        on_delete=models.CASCADE,
        related_name='messages'
    )

    class Role(models.TextChoices):
        USER = 'user', 'User'
        ASSISTANT = 'assistant', 'Assistant'
        SYSTEM = 'system', 'System'

    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    # Use this to store Algolia's 'queryID' and 'hits' (products)
    metadata = models.JSONField(null=True, blank=True)
    # NEW: Critical for AI improvement (Thumbs up/down)
    # None = No feedback, True = Helpful, False = Not Helpful
    feedback = models.BooleanField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.session.id}"