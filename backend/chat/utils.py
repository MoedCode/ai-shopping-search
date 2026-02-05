#ai-shopping-search/backend/chat/util.py
import json
import requests
from django.conf import settings

def query_algolia_streaming(query_text, session_id):
    """
    Opens a streaming connection to Algolia Agent.
    Yields raw SSE lines (decoded strings) as they arrive.
    """

    # 1. Retrieve Credentials
    app_id = getattr(settings, 'ALGOLIA_APP_ID', None)
    agent_id = getattr(settings, 'ALGOLIA_AGENT_ID', None)
    api_key = getattr(settings, 'ALGOLIA_API_KEY', None)

    # Safety Check
    if not all([app_id, agent_id, api_key]):
        error_msg = json.dumps({"type": "error", "message": "Server Config Error: Missing Algolia Credentials"})
        yield f"data: {error_msg}"
        return

    # 2. Construct URL
    # We use the official Agent Studio endpoint with compatibility mode
    url = f"https://{app_id.lower()}-dsn.algolia.net/agent-studio/1/agents/{agent_id}/completions?compatibilityMode=ai-sdk-5"

    headers = {
        "X-Algolia-Application-Id": app_id,
        "X-Algolia-API-Key": api_key,
        "Content-Type": "application/json",
    }

    # 3. Construct Payload
    # FIXED: Using 'parts' structure to match AgentTest.sh and fix Error 422
    payload = {
        "messages": [
            {
                "role": "user",
                "parts": [
                    {"text": query_text}
                ]
            }
        ],
        "conversation_id": str(session_id),
        "stream": True,
    }

    try:
        # 4. Open Connection
        # timeout=(connect, read): 5s to connect, 60s to wait for response stream
        with requests.post(url, json=payload, headers=headers, stream=True, timeout=(5, 60)) as response:

            # Check for non-200 HTTP errors immediately
            if response.status_code != 200:
                error_text = response.text or "Unknown Error"
                # Print detailed error to Django Console for debugging
                print(f"Algolia Error {response.status_code}: {error_text}")
                yield f"data: {json.dumps({'type': 'error', 'message': f'Algolia Error {response.status_code}'})}"
                return

            # 5. Stream Processing
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    yield decoded_line

    except requests.exceptions.RequestException as e:
        print(f"Algolia Connection Error: {e}")
        error_json = json.dumps({"type": "error", "message": "Connection to AI Agent failed."})
        yield f"data: {error_json}"

    except Exception as e:
        print(f"Internal Streaming Error: {e}")
        error_json = json.dumps({"type": "error", "message": "Internal Server Error."})
        yield f"data: {error_json}"