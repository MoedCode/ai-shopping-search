#ai-shopping-search/backend/search/serializers.py
from rest_framework import serializers
from .models import GuestSearch


class GuestSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestSearch
        fields = ['id', 'guest', 'query', 'results', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        return GuestSearch.objects.create(**validated_data)
