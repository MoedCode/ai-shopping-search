import json
import requests
from django.conf import settings

def query_algolia_streaming(query_text, session_id):
    """
    Opens a streaming connection to Algolia Agent.
    Yields raw SSE lines (decoded strings) as they arrive.

    This function acts as a 'pipe':
    Algolia -> [This Function] -> ChatView -> Next.js -> User
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
    # Ensure app_id is lowercased for the URL hostname standard
    url = f"https://{app_id.lower()}-dsn.algolia.net/agent-studio/1/agents/{agent_id}/search"

    headers = {
        "X-Algolia-Application-Id": app_id,
        "X-Algolia-API-Key": api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "query": query_text,
        "conversation_id": str(session_id),
        "stream": True,  # <--- CRITICAL: Tells Algolia to stream chunks
    }

    try:
        # 3. Open Connection
        # timeout=(connect, read): 5s to connect, 60s to wait for response stream
        with requests.post(url, json=payload, headers=headers, stream=True, timeout=(5, 60)) as response:

            # Check for non-200 HTTP errors immediately
            if response.status_code != 200:
                error_text = response.text or "Unknown Error"
                yield f"data: {json.dumps({'type': 'error', 'message': f'Algolia Error {response.status_code}: {error_text}'})}"
                return

            # 4. Stream Processing
            # iter_lines() automatically handles chunk boundaries
            for line in response.iter_lines():
                if line:
                    # Decode bytes to string so ChatView can process it
                    decoded_line = line.decode('utf-8')

                    # Yield immediately to keep the stream alive
                    yield decoded_line

    except requests.exceptions.RequestException as e:
        # Handle network failures (DNS, Timeout, Connection refused)
        print(f"Algolia Connection Error: {e}")
        error_json = json.dumps({"type": "error", "message": "Connection to AI Agent failed. Please try again."})
        yield f"data: {error_json}"

    except Exception as e:
        # Handle unexpected internal errors
        print(f"Internal Streaming Error: {e}")
        error_json = json.dumps({"type": "error", "message": "Internal Server Error during streaming."})
        yield f"data: {error_json}"