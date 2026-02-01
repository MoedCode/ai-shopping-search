#ai-shopping-search/backend/chat/models.py 1.27.26
```py
#ai-shopping-search/backend/chat/models.py
from django.db import models
from common.models import BaseModel


class UserMessage(BaseModel):
    """Model to represent a chat message.that user sent."""
    session = models.ForeignKey('chat.ChatSession', on_delete=models.CASCADE,
                                )



    def __str__(self):
        return f"Message from {self.session.user} in session {self.session.id}"
class AgentResponse(BaseModel):
    """Model to represent a chat message sent by the AI agent."""
    session = models.ForeignKey('chat.ChatSession', on_delete=models.CASCADE,
                                )
    message = models.ForeignKey('chat.UserMessage', on_delete=models.CASCADE,
                                related_name='agent_responses')
    response_text = models.TextField()
    items_descriptions = models.JSONField(null=True, blank=True)
    images_urls = models.JSONField(null=True, blank=True)
    sites__urls = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Agent Response in session {self.session.id}"
class ChatSession(BaseModel):
  """Model to represent a chat session."""
    user = models.ForeignKey('common.User', on_delete=models.CASCADE,
                             related_name='chat_messages', null=True, blank=True)
    # for guest users, so we can track their messages
    guest_id  = models.CharField(max_length=100, null=True, blank=True)
    title = models.CharField(max_length=255)

    def __str__(self):
        return f"ChatSession  {self.title}"
...