from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Guest, GuestChat
from .serializers import GuestSerializer, GuestChatSerializer


class CreateGuestView(APIView):
    """Create a new guest session and return guest_id"""
    
    def post(self, request):
        guest = Guest.objects.create()
        serializer = GuestSerializer(guest)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GuestChatView(APIView):
    """Save chat messages for guests"""
    
    def post(self, request):
        """Save a chat message from a guest"""
        guest_id = request.data.get('guest_id')
        message = request.data.get('message')
        response = request.data.get('response', None)
        
        if not guest_id or not message:
            return Response(
                {'error': 'guest_id and message are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            guest = Guest.objects.get(guest_id=guest_id)
        except Guest.DoesNotExist:
            return Response(
                {'error': 'Guest not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        guest_chat = GuestChat.objects.create(
            guest=guest,
            message=message,
            response=response
        )
        
        serializer = GuestChatSerializer(guest_chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get(self, request):
        """Get all chat messages for a guest"""
        guest_id = request.query_params.get('guest_id')
        
        if not guest_id:
            return Response(
                {'error': 'guest_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            guest = Guest.objects.get(guest_id=guest_id)
        except Guest.DoesNotExist:
            return Response(
                {'error': 'Guest not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        chats = guest.chat_messages.all()
        serializer = GuestChatSerializer(chats, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)