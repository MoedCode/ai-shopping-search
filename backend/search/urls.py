from django.urls import path
from search.views import GuestSearchView

urlpatterns = [
    path('guest', GuestSearchView.as_view(), name='guest-search'),
]
