#ai-shopping-search/backend/chat/urls.py
from django.urls import path
from .views import ChatView

urlpatterns = [
    path('session', ChatView.as_view(), name='chat-session'),
]