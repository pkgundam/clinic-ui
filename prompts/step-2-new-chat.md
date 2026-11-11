1. add a sidebar on the left of the chat screen that lists the chats from GET /chats
   - show the title. if the title is empty, show "New chat"
   - show a small "Unfinished" label when unfinished is true
   - highlight the chat that is open
2. load the list after login, and again after every reply,
   so a new chat and its title show up and the latest chat moves to the top
3. add a New chat button at the top of the sidebar
   it calls POST /chats, then clears the messages on screen
4. clicking a chat calls POST /chats/{thread_id}/open and replaces the messages on screen
   - each row becomes a user message and an assistant message
   - if ai_answer is empty, show only the user message
   - tool calls are not shown for old messages, that is fine
5. disable the sidebar while waiting for a reply,
   so the user cannot switch chats in the middle of an answer
6. test: I will test it in the browser
   - send a message, the chat appears in the sidebar with its title
   - click New chat, the screen clears, send a message, a second chat appears at the top
   - click the first chat, its messages show, send a message, the assistant carries on
   - start booking, answer a few intake questions, click New chat,
     the first chat shows "Unfinished". open it, the assistant carries on without asking again
- show the chats in a sidebar in the UI, with a New chat button
- clicking a chat shows its messages, and the user can keep chatting in it
