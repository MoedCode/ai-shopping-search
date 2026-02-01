[source](https://chatgpt.com/s/t_697f7137a28c819182a42626c7fefa21)

# Real-time Asynchronous Streaming  request/response
## *A* User Browser
```sql
User types message
User clicks "Send"

Browser opens connection to Next.js
Browser waits for streamed text
Browser appends text to UI as it arrives
Browser closes stream when server says DONE
```
## *B* Next.js (Frontend Server)
```sql
User types message
User clicks "Send"

Browser opens connection to Next.js
Browser waits for streamed text
Browser appends text to UI as it arrives
Browser closes stream when server says DONE

```
## *C* Backend Django

```sql
Receive message from Next.js

Validate session_id
IF invalid:
    Reject request
    Stop everything

Save user message to DB

Open streaming connection with Agent

Initialize:
    full_agent_answer = ""
    collected_metadata = {}

FOR each chunk coming from Agent:
    Forward chunk immediately to Next.js

    IF chunk contains "text":
        Append text to full_agent_answer

    IF chunk contains "tool output / hits":
        Store hits in collected_metadata

END stream

Save agent message to DB (ONCE)
Attach:
    full_agent_answer
    collected_metadata

Finish request
```
## *D* Agent
```sql
Receive query

Think
Search
Stream partial thoughts / text / results

Send chunks one by one

Send DONE
```