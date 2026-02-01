#ai-shopping-search/backend/accounts/serializers.py
from rest_framework import serializers
from accounts.models import User



# class UserSerializer(serializers.ModelSerializer):
#     """Serializer for User model."""
#     model = User
#     fields  = ['id', 'email', 'first_name', 'last_name', 'auth_provider', 'created_at']
#     read_only_fields = ['id', 'created_at', 'auth_provider']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer to view User details (Profile).
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'auth_provider',
            'is_guest',
            'created_at'
        ]
        read_only_fields = [
            'id',
            'created_at',
            'auth_provider',
            'is_guest',
            'email',
            'username'
        ]

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for registering new users via Email.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8
    )

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data.get('username'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_guest=False
        )
        return user