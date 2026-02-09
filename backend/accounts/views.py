#ai-shopping-search/backend/accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model, login, logout, authenticate
from django.db import transaction
from .serializers import UserSerializer, AuthActionSerializer, UpdateUserSerializer
# Import models to handle merging guest data into real accounts
from chat.models import ChatSession, SavedProduct 
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.microsoft.views import MicrosoftGraphOAuth2Adapter
from allauth.socialaccount.providers.apple.views import AppleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
User = get_user_model()

class AuthView(APIView):
    """
    Unified Endpoint for Authentication.
    Handles Login, Register, Guest Merging, and Account Deletion.
    """

    # 1. GET: Return Current User Info
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    # 2. POST: Handle Login / Register / Guest Conversion
    def post(self, request):
        serializer = AuthActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data['email'].lower()
        password = data['password']
        guest_identifier = data.get('guest_id') # The 'username' of the guest

        # Check if User already exists (LOGIN)
        if User.objects.filter(email=email).exists():
            user = authenticate(email=email, password=password)
            if not user:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            
            # --- MERGE LOGIC: Move Guest Data to Real User ---
            if guest_identifier:
                try:
                    guest_user = User.objects.get(username=guest_identifier, is_guest=True)
                    if guest_user.id != user.id:
                        with transaction.atomic():
                            # Move Chat Sessions
                            ChatSession.objects.filter(user=guest_user).update(user=user)
                            # Move Saved Products (Handle duplicates)
                            for sp in SavedProduct.objects.filter(user=guest_user):
                                if not SavedProduct.objects.filter(user=user, product_id=sp.product_id).exists():
                                    sp.user = user
                                    sp.save()
                                else:
                                    sp.delete() 
                            # Delete the old guest account
                            guest_user.delete()
                except User.DoesNotExist:
                    pass 
            
            login(request, user)
            return Response({
                "message": "Login successful",
                "user": UserSerializer(user).data
            })

        # User does not exist (REGISTER)
        else:
            # Try to upgrade existing Guest to Real User
            if guest_identifier:
                try:
                    user = User.objects.get(username=guest_identifier, is_guest=True)
                    user.email = email
                    user.set_password(password)
                    user.auth_provider = data.get('auth_provider', 'email')
                    user.is_guest = False # Upgrade status
                    user.save()
                    
                    login(request, user)
                    return Response({
                        "message": "Guest account upgraded",
                        "user": UserSerializer(user).data
                    }, status=status.HTTP_201_CREATED)
                except User.DoesNotExist:
                    pass

            # Create Brand New User
            user = User.objects.create_user(
                email=email,
                password=password,
                auth_provider=data.get('auth_provider', 'email'),
                is_guest=False
            )
            login(request, user)
            return Response({
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

    # 3. DELETE: Delete Account
    def delete(self, request):
        user_to_delete = None
        
        # Determine who to delete
        if request.user.is_authenticated:
            user_to_delete = request.user
        else:
            guest_id = request.data.get('guest_id')
            if guest_id:
                try:
                    user_to_delete = User.objects.get(username=guest_id, is_guest=True)
                except User.DoesNotExist:
                    pass

        if not user_to_delete:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        user_to_delete.delete()
        return Response({"message": "Account permanently deleted"}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully"})
    
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    # يجب أن يكون مطابقاً تماماً لما في Google Console
    callback_url = "http://localhost:3000" 

class MicrosoftLogin(SocialLoginView):
    adapter_class = MicrosoftGraphOAuth2Adapter
    client_class = OAuth2Client
    callback_url = "http://localhost:3000"

class AppleLogin(SocialLoginView):
    adapter_class = AppleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = "http://localhost:3000"