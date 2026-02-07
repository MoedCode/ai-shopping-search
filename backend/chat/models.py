#ai-shopping-search/backend/chat/models.py
from django.db import models
from common.models import BaseModel
import uuid
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

    title = models.CharField(max_length=255, blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    is_pinned = models.BooleanField(default=True)
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
    class Status(models.TextChoices):
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
    external_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    status = models.CharField(max_length=20, choices = Status.choices,
                              default=Status.IN_PROGRESS)
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
class SavedProduct(BaseModel):
    """
    Stores products the user has 'Hearted'.
    allow user to save product from Algolia agent response 
    """
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='saved_products'
    )
    
    # Mapping Algolia objectID to product_id
    product_id = models.CharField(max_length=100) 
    
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    brand = models.CharField(max_length=100, null=True, blank=True)
    
    # Using DecimalField for pricing accuracy
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_range = models.CharField(max_length=100, null=True, blank=True)
    
    # URLs
    image = models.URLField(max_length=500, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    
    # Complex data types as JSON
    categories = models.JSONField(default=list, blank=True)
    hierarchical_categories = models.JSONField(default=dict, blank=True)
    
    # Metadata
    type = models.CharField(max_length=100, null=True, blank=True)
    free_shipping = models.BooleanField(default=False)
    popularity = models.IntegerField(default=0)
    rating = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'product_id') # Prevent duplicates
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.name}"
    