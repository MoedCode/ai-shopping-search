from django.db import models
from common.models import BaseModel


class Guest(BaseModel):
    """Store guest sessions with unique identifiers"""
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Guest {self.id}"


class GuestChat(BaseModel):
    """Store chat messages from guest users before they register"""
    guest = models.ForeignKey('Guest', on_delete=models.CASCADE, related_name='chat_messages')
    message = models.TextField()
    response = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Chat from {self.guest.id} - {self.created_at}"
