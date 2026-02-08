#ai-shopping-search/backend/accounts/urls.py
from django.urls import path
from .views import AuthView, LogoutView

urlpatterns = [
    # رابط واحد موحد للعمليات الرئيسية (Get, Post, Patch, Delete)
    path('auth', AuthView.as_view(), name='auth-actions'),
    
    # رابط خاص لتسجيل الخروج
    path('logout', LogoutView.as_view(), name='logout'),
]