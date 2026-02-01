from django.db import models

import uuid
import os
from django.contrib.auth.models import (
    AbstractBaseUser, PermissionsMixin, BaseUserManager
)
from common.models import BaseModel

class CustomUserManager(BaseUserManager):
    """
    Custom manager to handle User and Guest creation logic.
    """

    def create_user(self, email=None, password=None, username=None, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        - If is_guest=True: Generates a placeholder email and username.
        - If is_guest=False: Email is required. Username defaults to email prefix if missing.
        """
        is_guest = extra_fields.get('is_guest', False)

        # --- Logic for Guests ---
        if is_guest:
            # Generate a unique identifier for the guest
            guest_uid = str(uuid.uuid4())
            username = f"guest_{guest_uid[:10]}"
            email =f"{username}@{os.getenv('SITE_DOMAIN','untitled')}"
            extra_fields.setdefault('auth_provider', User.AuthProvider.ANONYMOUS)
        # --- Logic for Real Users ---
        else:
            if not email:
                raise ValueError('The Email field must be set for registered users.')

            email = self.normalize_email(email)

            # Auto-generate username from email if not provided
            if not username:
                base_username = email.split('@')[0]
                username = f"{base_username}_{str(uuid.uuid4())[:4]}"
                # Note: In a real production app, you might want to append random digits
                # here to ensure uniqueness if 'john@gmail' and 'john@yahoo' both sign up.

        # Create the model instance
        user = self.model(email=email, username=username, **extra_fields)

        # Set password
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Creates a superuser with admin permissions.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_guest', False)
        extra_fields.setdefault('is_active', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

    def create_guest(self):
        """
        Helper method to specifically create a guest user.
        """
        return self.create_user(is_guest=True)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Unified User model.
    - Supports 'Proton/Tuta' users via 'EMAIL' provider.
    - Supports Guests via 'ANONYMOUS' provider.
    - No email verification required (Active by default).
    """

    class AuthProvider(models.TextChoices):
            EMAIL = 'email', 'Email'           # For Gmail, Proton, Tuta, etc. (Manual Entry)
            GOOGLE = 'google', 'Google'        # Social Auth
            APPLE = 'apple', 'Apple'           # Social Auth
            MICROSOFT = 'microsoft', 'Microsoft' # Social Auth
            PASSKEY = 'passkey', 'Passkey / YubiKey'
            ANONYMOUS = 'anonymous', 'Anonymous' # For Guests

    # --- Identity Fields ---
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, db_index=True)

    # --- Profile Fields (Nullable for Guests) ---
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_image = models.URLField(blank=True, null=True)

    # --- State & Tracking ---
    auth_provider = models.CharField(
        max_length=20,
        choices=AuthProvider.choices,
        default=AuthProvider.EMAIL
    )
    is_guest = models.BooleanField(default=False)

    # --- Django Internals ---
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = CustomUserManager()

    # Email remains the primary identifier for login
    USERNAME_FIELD = 'email'
    # Required when creating a superuser via terminal (besides email/password)
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        if self.is_guest:
            return self.username  # Returns "guest_1234abcd"
        return self.email

    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username