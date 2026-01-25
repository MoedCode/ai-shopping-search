from django.urls import path, include

from chat.views import CreateGuestView, GuestChatView
urlpatterns = [
    path('guest/create', CreateGuestView.as_view(), name='create-guest'),
    path('guest', GuestChatView.as_view(), name='guest-chat'),

]