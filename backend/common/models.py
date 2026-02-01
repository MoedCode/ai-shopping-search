#ai-shopping-search/backend/common/models.py
from django.db import models
import uuid
from django.contrib.auth.models import (
    AbstractBaseUser, PermissionsMixin, BaseUserManager
)


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




