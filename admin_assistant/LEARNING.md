# Learn the agent — file by file

## 1. User sends a message (frontend)

**`frontend/src/projectAssistant/useProjectAssistantChat.js`**

- Saves messages in `sessionStorage` (browser memory for this tab).
- `POST /api/v1/assistant/chat` with `{ projectId, message, history }`.
- `history` = prior user/assistant text so Gemini can handle follow-ups.

## 2. Auth + admin check (Node)

**`backend/src/routes/assistant.routes.js`**

- `auth` middleware → JWT required.
- `requireAdmin` → only `role: admin` (PRD: role-based access).

## 3. Orchestration loop (Node) — the “agent brain”

**`backend/src/services/assistantChat.service.js`**

```
loop (max 6 rounds):
  call Python /v1/complete
  if Gemini returns text → done
  if Gemini returns tool_calls → run tools → append results → loop again
```

This is **function calling**: Gemini picks a tool name + args; Node runs real code.

## 4. Tools = truth (Node)

**`backend/src/assistant/tools/`**

| Tool | File | Data source |
|------|------|-------------|
| `get_inventory_summary` | `inventory.tool.js` | `Plot` collection |
| `list_plots` | `inventory.tool.js` | `Plot` collection |
| `get_revenue_summary` | `payments.tool.js` | `Payment` collection |
| `list_pending_payments` | `payments.tool.js` | `Payment` collection |
| `list_interested_buyers` | `contacts.tool.js` | `Contact` collection |
| `get_plot_health_summary` | `plotHealth.tool.js` | dead plot AI service |
| `get_price_suggestion` | `price.tool.js` | price AI service |

**`registry.js`** maps tool name → function.  
**`definitions.js`** is the menu Gemini sees (names + descriptions).

`projectId` is **never** passed by Gemini — Node injects it from the chat request.

## 5. LLM turn (Python)

**`admin_assistant/gemini_client.py`**

- Sends conversation + tool menu to Gemini.
- Returns either `{ type: "message" }` or `{ type: "tool_calls" }`.

Gemini does **not** invent plot counts — it only formats tool results.

## 6. PRD rules we follow

| Do | Where |
|----|-------|
| Predefined intents | `definitions.js` tool list |
| Existing services | tools use Mongoose + AI proxies |
| Validate access | JWT + admin + projectId from client |
| No open DB queries | no Text-to-SQL |

| Don't | How |
|-------|-----|
| Generic chatbot | system prompt + tools only |
| Internet search | not implemented |
| Expose API key | key only in `admin_assistant/.env` |

## 7. Test without UI

```powershell
# Terminal 1
cd admin_assistant && uvicorn app:app --port 8002

# Terminal 2
cd backend && npm run dev

# Terminal 3 — need admin JWT from login
curl -X POST http://localhost:5000/api/v1/assistant/chat ^
  -H "Authorization: Bearer YOUR_JWT" ^
  -H "Content-Type: application/json" ^
  -d "{\"projectId\":\"485775\",\"message\":\"How many plots are available?\",\"history\":[]}"
```

## 8. Add a new capability

1. Add handler in `backend/src/assistant/tools/*.tool.js`
2. Register in `registry.js`
3. Add declaration in `definitions.js`
4. Gemini can call it on the next message — no prompt hack needed.
