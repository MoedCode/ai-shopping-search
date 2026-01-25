from rest_framework import serializers
from .models import GuestChat





class GuestChatSerializer(serializers.ModelSerializer):
    guest_id = serializers.UUIDField(source='guest.id', read_only=True)

    class Meta:
        model = GuestChat
        fields = ['id', 'guest_id', 'message', 'response', 'created_at']
        read_only_fields = ['id', 'created_at', 'guest_id']

    def create(self, validated_data):
        # creation is handled in the view (we expect a Guest instance there)
        return GuestChat.objects.create(**validated_data)
