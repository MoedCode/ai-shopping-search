from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from chat.models import Guest
from .models import GuestSearch
from .serializers import GuestSearchSerializer


class GuestSearchView(APIView):
    """Save search results for guests"""
    
    def post(self, request):
        """Save a search query and results"""
        guest_id = request.data.get('guest_id')
        query = request.data.get('query')
        results = request.data.get('results', [])
        
        if not guest_id or not query:
            return Response(
                {'error': 'guest_id and query are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            guest = Guest.objects.get(guest_id=guest_id)
        except Guest.DoesNotExist:
            return Response(
                {'error': 'Guest not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        guest_search = GuestSearch.objects.create(
            guest=guest,
            query=query,
            results=results
        )
        
        serializer = GuestSearchSerializer(guest_search)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get(self, request):
        """Get all search results for a guest"""
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
        
        searches = guest.search_results.all()
        serializer = GuestSearchSerializer(searches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
