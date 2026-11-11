Build a clean chat UI for a clinic appointment assistant. The backend already
exists. This project is used in beginner tutorial videos, so keep the code
simple and readable.

Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, and AI Elements.

Before writing code, read https://ui.shadcn.com/docs/ai-elements and the pages
for Chat, Message, Tool, Prompt Input and Suggestion. AI Elements has no package
to install. The code is copied into the project, so follow what the docs say.
The backend is a plain REST API, not the AI SDK, so use fetch and React state.
Adapt the components if they expect AI SDK types. Tell me if you hit something
that needs the AI SDK.

Backend: FastAPI at http://localhost:8000. It allows CORS from
http://localhost:3000, so run the UI on port 3000. Read the URL from
NEXT_PUBLIC_API_URL.

POST /login
  Body: { "email", "password" }
  200: { "token", "thread_id", "user": { "id", "full_name", "email", "role" } }
  401: wrong email or password

POST /chat
  Header: Authorization: Bearer <token>
  Body: { "message" }
  200: { "reply", "tool_calls": [ { "name", "args", "result" } ] }
  401: session expired

Pages:

1. /login
   Email and password form with a clear error message on 401.

2. /chat (redirects to /login if there is no token)
   - Header with the clinic name, the patient's name and a log out button.
     Log out only clears the token in the browser.
   - Messages from the patient and the assistant. Render assistant replies as
     markdown.
   - For each assistant reply, show its tool calls above the reply using the
     Tool component, collapsed by default. Each one shows the tool name, and
     opens to show the arguments and the result.
   - Prompt input at the bottom. Enter sends, Shift+Enter adds a new line.
     Disable it while waiting.
   - While waiting, show a "thinking" state. Replies take a while because the
     agent runs several tools.
   - When the chat is empty, show a greeting and these suggestions:
     "Book an appointment", "When is my next appointment?",
     "Is my insurance accepted?", "Which doctors do you have?"
   - Keep scrolled to the newest message.
   - On 401, clear the token and go to /login. On other errors, show a friendly
     message and let the patient try again.

Design: calm and clean, like a modern healthcare product. Light theme, plenty of
white space, one soft accent color, works on desktop and mobile.

Rules:
- Keep the token in sessionStorage.
- No streaming, signup or chat history for now.
- Never log the password or token.
- Put API calls in one file, lib/api.ts.
- Do not commit.

To test, log in with priya@example.com / clinicdemo, ask "Which doctors do you
have?", and check the tool call appears and opens. Show me what you tested.
