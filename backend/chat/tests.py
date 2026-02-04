#ai-shopping-search/backend/chat/tests.py
# ai-shopping-search/backend/chat/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from unittest.mock import patch
from .models import ChatSession, ChatMessage

User = get_user_model()

class ChatViewTests(TestCase):
    """
    Test suite for the ChatView API endpoint.
    
    This suite tests the following functionalities:
    1. Session creation for new guest users.
    2. Session linking for authenticated users.
    3. Message persistence (User and Assistant).
    4. Chat history retrieval.
    5. Session deletion.
    """

    def setUp(self):
        """
        Initialize the test client and create a test user.
        """
        self.client = APIClient()
        # Matches the 'name' defined in chat/urls.py
        self.url = reverse('chat-session')
        
        # Create a standard authenticated user
        self.username = 'testuser'
        self.password = 'testpass123'
        self.user = User.objects.create_user(
            username=self.username, 
            password=self.password
        )

    @patch('chat.views.query_algolia_streaming')
    def test_post_message_new_guest(self, mock_algolia):
        """
        Test that posting a message without authentication creates a new guest user
        and a new chat session.
        """
        # Mock the streaming response from Algolia
        # The view expects strings (decoded lines) from the utility
        mock_algolia.return_value = iter([
            'data: {"type": "text_delta", "delta": "Hello world"}'
        ])

        payload = {'message': 'Hello AI'}
        
        # Send POST request without authentication
        response = self.client.post(self.url, payload, format='json')

        # Check that the request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.streaming)

        # Consume the streaming content to trigger the generator execution
        # This is necessary because the database saves happen inside the generator loop
        stream_content = b"".join(response.streaming_content).decode('utf-8')

        # Verify that a session was created
        session = ChatSession.objects.first()
        self.assertIsNotNone(session, "ChatSession should be created")
        
        # Verify the session is associated with a guest user (not our auth user)
        self.assertNotEqual(session.user, self.user)
        
        # Verify messages were saved to the DB
        messages = ChatMessage.objects.filter(session=session)
        self.assertEqual(messages.count(), 2, "Should have 1 User message and 1 Assistant message")
        
        user_msg = messages.filter(role=ChatMessage.Role.USER).first()
        self.assertEqual(user_msg.content, 'Hello AI')
        
        ai_msg = messages.filter(role=ChatMessage.Role.ASSISTANT).first()
        self.assertIn('Hello world', ai_msg.content)

    @patch('chat.views.query_algolia_streaming')
    def test_post_message_authenticated(self, mock_algolia):
        """
        Test that posting a message as an authenticated user links the session
        to that user.
        """
        mock_algolia.return_value = iter([
            'data: {"type": "text_delta", "delta": "I am here"}'
        ])

        # Authenticate the client
        self.client.force_authenticate(user=self.user)
        
        payload = {'message': 'My authenticated message'}
        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Consume stream to ensure DB operations complete
        list(response.streaming_content)

        # Verify session is linked to the authenticated user
        session = ChatSession.objects.filter(user=self.user).first()
        self.assertIsNotNone(session)
        self.assertEqual(session.title, 'My authenticated message')

    def test_get_history(self):
        """
        Test retrieving the chat history for a specific session.
        """
        # Setup: Create a session and some messages
        session = ChatSession.objects.create(user=self.user, title="History Session")
        ChatMessage.objects.create(
            session=session, 
            role=ChatMessage.Role.USER, 
            content="Question"
        )
        ChatMessage.objects.create(
            session=session, 
            role=ChatMessage.Role.ASSISTANT, 
            content="Answer"
        )

        self.client.force_authenticate(user=self.user)
        
        # Send GET request with session_id
        response = self.client.get(self.url, {'session_id': str(session.id)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['content'], "Question")
        self.assertEqual(response.data[1]['content'], "Answer")

    def test_get_history_invalid_session(self):
        """
        Test retrieving history for a non-existent session returns 404.
        """
        self.client.force_authenticate(user=self.user)
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        
        response = self.client.get(self.url, {'session_id': fake_uuid})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_session(self):
        """
        Test deleting a chat session.
        """
        session = ChatSession.objects.create(user=self.user, title="To Delete")
        
        self.client.force_authenticate(user=self.user)
        
        # Send DELETE request
        response = self.client.delete(self.url, {'session_id': str(session.id)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ChatSession.objects.filter(id=session.id).exists())

    def test_post_no_message(self):
        """
        Test that posting without a 'message' field returns a 400 error.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
