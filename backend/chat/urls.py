#ai-shopping-search/backend/chat/urls.py
from django.urls import path
from .views import ChatView, SavedProductsView

urlpatterns = [
    path('session', ChatView.as_view(), name='chat-session'),
    path('products',SavedProductsView.as_view(), name='products'),
    path('saved-products', SavedProductsView.as_view(), name='saved-products'),
]