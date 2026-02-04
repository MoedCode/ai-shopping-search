# Algolia Agent Response Anatomy (SSE Stream)

This document outlines the chronological and logical flow of the Server-Sent Events (SSE) stream received from the Algolia Agent. Understanding this flow is critical for handling the **Pass-through Streaming** architecture in the Backend and the **Real-time UI** updates in the Frontend.

---

## Phase 1: The Handshake (Initialization) 🚦
The Agent acknowledges the request and assigns identifiers.

### 1. `type: "start"`
* **Meaning:** "I received the message and started processing."
* **Key Data:** `messageId` (Unique ID for this conversation turn).
* **Action:** System logs the start of a turn.

### 2. `type: "start-step"`
* **Meaning:** The Agent is beginning a logical reasoning step (e.g., thinking or deciding to use a tool).

---

## Phase 2: Tool Usage (Search & Data Retrieval) 🛠️
The Agent's "Brain" decides it needs external information (the Product Catalog).

### 3. `type: "tool-input-start"`
* **Meaning:** The Agent decided to call a specific tool.
* **Key Data:**
    * `toolName`: "algolia_search_index"
    * `toolCallId`: Unique ID for this specific search action.
* **UI Action:** Show a "Searching..." indicator or spinner.

### 4. `type: "tool-input-delta"` (Debugging)
* **Meaning:** The Agent is constructing the search query character-by-character.
* **Usage:** Usually ignored in Production UI; useful for debugging query formulation.

### 5. `type: "tool-input-available"`
* **Meaning:** The search query is fully formulated and ready to execute.
* **Key Data:** `input` object containing the final query parameters (e.g., `{"query": "HTC Phone", "index": "products"}`).

### 6. `type: "tool-output-available"` (💎 CRITICAL)
* **Meaning:** The search is complete, and results are returned from Algolia.
* **Key Data:**
    * `output.hits`: The array of product objects (images, prices, names).
    * `output.nbHits`: Total number of results found.
* **Backend Action:** Capture this JSON chunk to save `products` in the Database later.
* **Frontend Action:** Render the **Product Cards** immediately (before the text response starts).

### 7. `type: "finish-step"`
* **Meaning:** The "Search" step is officially over. The Agent now has the data.

---

## Phase 3: The Response (Text Streaming) 💬
The Agent explains the results to the user naturally.

### 8. `type: "text-start"`
* **Meaning:** "I am about to start speaking/typing the answer."

### 9. `type: "text-delta"` (The Stream 🌊)
* **Meaning:** A fragment of the final text response.
* **Key Data:** `delta` (The actual string/word, e.g., "I", " found", " some").
* **Backend Action:** Accumulate these strings to form the `full_agent_answer`.
* **Frontend Action:** Append to the message bubble immediately to create a "Typewriter Effect".

### 10. `type: "text-end"`
* **Meaning:** The Agent has finished generating the text.

---

## Phase 4: Closure (Termination) 🏁
The cycle ends, and connections are closed.

### 11. `type: "finish-step"`
* **Meaning:** The "Speaking" step is over.

### 12. `type: "finish"`
* **Meaning:** The entire request processing is complete.

### 13. `data: [DONE]`
* **Meaning:** The SSE Stream is officially closed.
* **Backend Action:**
    * Break the loop.
    * Save the accumulated `ChatMessage` (Text + Hits) to PostgreSQL (ONCE).
    * Close the connection.
* **Frontend Action:** Stop the reader and enable the input for the next message.