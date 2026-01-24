from rest_framework import serializers
from .models import Guest, GuestChat


class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['guest_id', 'created_at', 'last_activity']
        read_only_fields = ['guest_id', 'created_at', 'last_activity']


class GuestChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestChat
        fields = ['id', 'guest', 'message', 'response', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        return GuestChat.objects.create(**validated_data)
