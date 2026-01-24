from django.db import models
from common.models import BaseModel
from chat.models import Guest


class GuestSearch(BaseModel):
    """Store search results from guest users before they register"""
    guest = models.ForeignKey('chat.Guest', on_delete=models.CASCADE, related_name='search_results')
    query = models.CharField(max_length=255)
    results = models.JSONField(default=list)  # Store search results as JSON

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Search '{self.query}' by {self.guest.id}"
