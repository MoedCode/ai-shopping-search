#ai-shopping-search/backend/chat/algolia_agent.py
import requests
from django.conf import settings

def query_algolia_agent(query_text, session_id):
    """
    Sends the user command to Algolia Agent Studio API.
    Args:
        query_text (str): The message typed by the user.
        session_id (str): The unique session UUID to maintain conversation context.
    Returns:
        dict: The JSON response from Algolia or None if an error occurs.
    """
    # 1. Retrieve credentials from Django settings
    app_id = getattr(settings, 'ALGOLIA_APP_ID', None)
    agent_id = getattr(settings, 'ALGOLIA_AGENT_ID', None)
    api_key = getattr(settings, 'ALGOLIA_API_KEY', None)
    agent_url=getattr(settings, 'ALGOLIA_AGENT_URL', None)
    # 2. Validation
    if not all([app_id, agent_id, api_key, agent_url]):
        print("Error: Missing Algolia credentials or agent_url in settings.py")
        return None
    # 3. Construct the Endpoint
    # We use the DSN (Distributed Search Network) host for best performance
    headers = {
        "X-Algolia-Application-Id": app_id,
        "X-Algolia-API-Key": api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "query": query_text,
        "conversation_id": str(session_id),
        "stream": True,
    }
    try:
        # Enable streaming in python requests
        with requ

    # 4. Execute Request
    try:
        response = requests.post(agent_url, json=payload, headers=headers)
        response.raise_for_status() # Raises error for 4xx/5xx codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Algolia Connection Error: {e}")
        return None