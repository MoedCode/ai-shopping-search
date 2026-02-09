from django.urls import path, include
from .views import AuthView, LogoutView

urlpatterns = [
    path('auth', AuthView.as_view(), name='auth-actions'),
    path('logout', LogoutView.as_view(), name='logout'),
    
    # This enables the /accounts/google/login/ endpoints etc.
    # It requires 'allauth.urls' to be included if you installed django-allauth
    path('', include('allauth.urls')), 
]