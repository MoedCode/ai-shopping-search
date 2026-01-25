from django.db import models
import uuid


class BaseModel(models.Model):
    """
    Abstract base model for all models in the project.
    Provides UUID primary key and timestamp fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Guest(BaseModel):
    """Store guest sessions with unique identifiers"""
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Guest {self.id}"
