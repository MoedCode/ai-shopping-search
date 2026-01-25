from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from common.models import Guest
from .models import GuestChat
from common.serializers import GuestSerializer
from .serializers import GuestChatSerializer


def _get_or_create_guest_from_request(request, create_if_missing=False):
    """Try to locate Guest from request in this order:
    - request.data['guest_id']
    - request.query_params['guest_id']
    - request.COOKIES['guest_id']
    - Header 'X-Guest-Id'

    Returns tuple (guest_instance or None, created_bool)
    """
    guest_id = (
        request.data.get('guest_id') if hasattr(request, 'data') else None
    ) or request.query_params.get('guest_id') or request.COOKIES.get('guest_id') or request.headers.get('X-Guest-Id')

    if guest_id:
        try:
            return Guest.objects.get(id=guest_id), False
        except Guest.DoesNotExist:
            # fallthrough: create only if requested
            if not create_if_missing:
                return None, False

    if create_if_missing:
        g = Guest.objects.create()
        return g, True

    return None, False


class CreateGuestView(APIView):
    """Create a new guest session and return guest_id"""

    def post(self, request):
        guest = Guest.objects.create()
        serializer = GuestSerializer(guest)
        resp = Response(serializer.data, status=status.HTTP_201_CREATED)
        # set cookie so frontend can persist guest_id
        resp.set_cookie('guest_id', str(guest.id), httponly=False, samesite='Lax', max_age=60 * 60 * 24 * 365)
        return resp


class GuestChatView(APIView):
    """Combined view to GET/POST/DELETE guest chats.

    GET:  /chat/guest?guest_id=<uuid>  -> list chats
    POST: /chat/guest  { guest_id?, message, response? } -> create chat (creates guest if missing and returns cookie)
    DELETE: /chat/guest  { guest_id?, chat_id? } -> delete a specific chat (chat_id) OR delete all chats for guest if chat_id omitted
    """

    def get(self, request):
        guest, _ = _get_or_create_guest_from_request(request, create_if_missing=False)
        if not guest:
            return Response({'error': 'guest_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        chats = guest.chat_messages.all()
        serializer = GuestChatSerializer(chats, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # allow creating guest automatically if frontend didn't have one
        guest, created = _get_or_create_guest_from_request(request, create_if_missing=True)

        message = request.data.get('message')
        response_text = request.data.get('response', None)

        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

        guest_chat = GuestChat.objects.create(guest=guest, message=message, response=response_text)
        serializer = GuestChatSerializer(guest_chat)
        resp = Response(serializer.data, status=status.HTTP_201_CREATED)

        if created:
            resp.set_cookie('guest_id', str(guest.id), httponly=False, samesite='Lax', max_age=60 * 60 * 24 * 365)

        return resp

    def delete(self, request):
        guest, _ = _get_or_create_guest_from_request(request, create_if_missing=False)
        if not guest:
            return Response({'error': 'guest_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        chat_id = request.data.get('chat_id') or request.query_params.get('chat_id')
        if chat_id:
            try:
                chat = GuestChat.objects.get(id=chat_id, guest=guest)
                chat.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except GuestChat.DoesNotExist:
                return Response({'error': 'Chat not found'}, status=status.HTTP_404_NOT_FOUND)

        # no chat_id provided => delete all guest chats
        guest.chat_messages.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)