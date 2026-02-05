#ai-shopping-search/backend/search/models.py
from django.db import models
from common.models import BaseModel
from accounts.models import User



class UserSearch(BaseModel):
    """Store search results from users"""
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name='search_results')
    query = models.CharField(max_length=255)
    results = models.JSONField(default=list)  # Store search results as JSON

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Search '{self.query}' by {self.user.id}"