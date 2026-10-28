# AI Chat

A single-page chat app for Google Gemini. You type a message, the reply streams in, and the thread stays open so you can keep going. Past chats sit in a sidebar and come back after a refresh. They live in this browser only. There is no account and no server-side history.

The name in the header is ChatGpt. Replies come from Gemini (`gemini-3-flash-preview`).

## What you can do

- Send a message and read the reply as it arrives. Stop generation if you want to.
- Retry a failed reply, or regenerate a finished one.
- Edit a message you already sent. The chat continues from that edit.
- Start a new chat, switch between chats, or delete one.
- Read replies as formatted text. Code blocks are highlighted, and you can copy a block or the whole reply.
- Attach one PDF, `.txt`, or `.md` file and ask about it. Later questions in that same chat still use the file. A different chat does not.

## Run it

```bash
npm install
```

Put your Gemini key in `.env.local` at the project root:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open the local URL Next prints.
