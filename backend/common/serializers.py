from rest_framework import serializers
from .models import Guest

class GuestSerializer(serializers.ModelSerializer):
    guest_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = Guest
        fields = ['guest_id', 'created_at', 'last_activity']
        read_only_fields = ['guest_id', 'created_at', 'last_activity']