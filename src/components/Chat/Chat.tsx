import { useEffect, useRef, useState } from "react"
import { v4 as uuid } from "uuid";

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"
import { ChatStore, Conversation, Message, NEW_CHAT_TITLE } from "@/types/chat"
import { consumeStreamText } from "@/lib/streamMarker"
import {
  createConversation,
  loadStore,
  saveStore,
  titleFromMessage,
} from "@/lib/storage"

const GENERIC_ERROR = "Something went wrong";

class ResponseError extends Error {
  readonly publicMessage: string;

  constructor(publicMessage: string) {
    super(publicMessage);
    this.name = "ResponseError";
    this.publicMessage = publicMessage;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function appendChunk(messages: Message[], id: string, chunk: string): Message[] {
  if (!chunk) return messages;

  const index = messages.findIndex((message) => message.id === id);
  if (index === -1) return messages;

  const current = messages[index];
  const next = messages.slice();
  next[index] = { ...current, content: current.content + chunk };
  return next;
}

function updateMessage(
  messages: Message[],
  id: string,
  patch: Partial<Message>
): Message[] {
  const index = messages.findIndex((message) => message.id === id);
  if (index === -1) return messages;

  const next = messages.slice();
  next[index] = { ...messages[index], ...patch };
  return next;
}

function withoutEmptyPlaceholders(messages: Message[]): Message[] {
  return messages.filter(
    (message) => !(message.role === "assistant" && message.content === "")
  );
}

function updateConversation(
  store: ChatStore,
  conversationId: string,
  updater: (conversation: Conversation) => Conversation
): ChatStore {
  let changed = false;
  const conversations = store.conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;
    const next = updater(conversation);
    if (next === conversation) return conversation;
    changed = true;
    return next;
  });

  if (!changed) return store;
  return { ...store, conversations };
}

function mapConversationMessages(
  store: ChatStore,
  conversationId: string,
  mapper: (messages: Message[]) => Message[]
): ChatStore {
  let changed = false;
  const conversations = store.conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;

    const messages = mapper(conversation.messages);
    if (messages === conversation.messages) return conversation;

    changed = true;
    return { ...conversation, messages, updatedAt: Date.now() };
  });

  if (!changed) return store;
  return { ...store, conversations };
}

interface ChatProps {
  onRegisterNewChat: (newChat: () => void) => void
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string" &&
      body.error.trim()
    ) {
      return body.error;
    }
  } catch {
    // Non-JSON bodies fall through to the generic sentence.
  }

  return GENERIC_ERROR;
}

const Chat = ({ onRegisterNewChat }: ChatProps) => {
  const [store, setStore] = useState<ChatStore | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const onRegisterNewChatRef = useRef(onRegisterNewChat);
  const handleNewChatRef = useRef<() => void>(() => {});

  const active = store?.conversations.find(
    (conversation) => conversation.id === store.activeId
  );
  const messages = active?.messages ?? [];

  useEffect(() => {
    setStore(loadStore());
  }, []);

  useEffect(() => {
    if (!store) return;
    saveStore(store);
  }, [store]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    onRegisterNewChatRef.current = onRegisterNewChat;
  }, [onRegisterNewChat]);

  useEffect(() => {
    onRegisterNewChatRef.current(() => handleNewChatRef.current());
  }, []);

  const streamAssistantReply = async (history: Message[], conversationId: string) => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const assistantMessage: Message = {
      id: uuid(),
      role: "assistant",
      content: "",
      status: "streaming",
    };
    const assistantId = assistantMessage.id;
    let held = "";
    let failed = false;

    const pushText = (text: string) => {
      if (!text) return;
      setStore((prev) => {
        if (!prev) return prev;
        return mapConversationMessages(prev, conversationId, (current) =>
          appendChunk(current, assistantId, text)
        );
      });
    };

    const consume = (chunk: string) => {
      if (failed || !chunk) return;

      const next = consumeStreamText(held, chunk);
      held = next.held;
      pushText(next.visible);

      if (next.failed) {
        failed = true;
        held = "";
        setStore((prev) => {
          if (!prev) return prev;
          return mapConversationMessages(prev, conversationId, (current) =>
            updateMessage(current, assistantId, {
              status: "error",
              error: GENERIC_ERROR,
            })
          );
        });
      }
    };

    setStore((prev) => {
      if (!prev) return prev;
      return mapConversationMessages(prev, conversationId, (current) => [
        ...current,
        assistantMessage,
      ]);
    });
    setIsThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: history,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ResponseError(await readErrorMessage(response));
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new ResponseError(GENERIC_ERROR);
      }

      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        consume(decoder.decode(value, { stream: true }));
      }

      consume(decoder.decode());

      if (!failed && held) {
        pushText(held);
        held = "";
      }

      if (!failed) {
        setStore((prev) => {
          if (!prev) return prev;
          return mapConversationMessages(prev, conversationId, (current) =>
            updateMessage(current, assistantId, { status: "complete" })
          );
        });
      }
    } catch (error) {
      if (isAbortError(error)) {
        if (held) {
          const pending = held;
          held = "";
          setStore((prev) => {
            if (!prev) return prev;
            return mapConversationMessages(prev, conversationId, (current) =>
              appendChunk(current, assistantId, pending)
            );
          });
        }

        setStore((prev) => {
          if (!prev) return prev;
          return mapConversationMessages(prev, conversationId, (current) => {
            const message = current.find((item) => item.id === assistantId);
            if (!message || message.content === "") {
              return current.filter((item) => item.id !== assistantId);
            }
            return updateMessage(current, assistantId, { status: "cancelled" });
          });
        });
        return;
      }

      const publicMessage =
        error instanceof ResponseError ? error.publicMessage : GENERIC_ERROR;

      setStore((prev) => {
        if (!prev) return prev;
        return mapConversationMessages(prev, conversationId, (current) =>
          updateMessage(current, assistantId, {
            status: "error",
            error: publicMessage,
          })
        );
      });
      console.error("Chat error:", error);
    } finally {
      if (requestIdRef.current === requestId) {
        setIsThinking(false);
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    }
  };

  const handleSendMessage = (text: string) => {
    if (!active) return;

    const conversationId = active.id;
    const userMessage: Message = {
      id: uuid(),
      role: "user",
      content: text,
    };
    const history = withoutEmptyPlaceholders([...active.messages, userMessage]);

    setStore((prev) => {
      if (!prev) return prev;
      return updateConversation(prev, conversationId, (conversation) => ({
        ...conversation,
        title:
          conversation.title === NEW_CHAT_TITLE
            ? titleFromMessage(userMessage.content)
            : conversation.title,
        messages: [...conversation.messages, userMessage],
        updatedAt: Date.now(),
      }));
    });
    void streamAssistantReply(history, conversationId);
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setIsThinking(false);
    setStore((prev) => {
      if (!prev) return prev;
      const conversation = createConversation();
      return {
        activeId: conversation.id,
        conversations: [conversation, ...prev.conversations],
      };
    });
  };

  handleNewChatRef.current = handleNewChat;

  const handleStop = () => {
    abortRef.current?.abort();
    setIsThinking(false);
  };

  const handleRetry = (assistantId: string) => {
    if (isThinking || !active) return;

    const conversationId = active.id;
    const index = messages.findIndex((message) => message.id === assistantId);
    if (index === -1) return;

    const history = withoutEmptyPlaceholders(messages.slice(0, index));
    setStore((prev) => {
      if (!prev) return prev;
      return updateConversation(prev, conversationId, (conversation) => ({
        ...conversation,
        messages: history,
        updatedAt: Date.now(),
      }));
    });
    void streamAssistantReply(history, conversationId);
  };

  const handleEdit = (id: string, nextText: string) => {
    if (isThinking || !active) return;

    const trimmed = nextText.trim();
    if (!trimmed) return;

    const conversationId = active.id;
    const index = messages.findIndex((message) => message.id === id);
    if (index === -1 || messages[index].role !== "user") return;

    const edited: Message = { ...messages[index], content: trimmed };
    const history = withoutEmptyPlaceholders([
      ...messages.slice(0, index),
      edited,
    ]);

    setStore((prev) => {
      if (!prev) return prev;
      return updateConversation(prev, conversationId, (conversation) => ({
        ...conversation,
        messages: history,
        updatedAt: Date.now(),
      }));
    });
    void streamAssistantReply(history, conversationId);
  };

  return (
    <div className={styles["chat-container"]}>
      {store && messages.length ? (
        <MessageList
          messages={messages}
          isStreaming={isThinking}
          onRetry={handleRetry}
          onRegenerate={handleRetry}
          onEdit={handleEdit}
        />
      ) : store ? (
        <EmptyState />
      ) : null}
      {active ? (
        <ChatInput
          key={active.id}
          onMessageSend={handleSendMessage}
          onStop={handleStop}
          isThinking={isThinking}
        />
      ) : null}
    </div>
  )
}

export default Chat
