import { useEffect, useRef, useState } from "react"
import { v4 as uuid } from "uuid";

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"
import { Message } from "@/types/chat"
import { consumeStreamText } from "@/lib/streamMarker"

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

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const streamAssistantReply = async (history: Message[]) => {
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
      setMessages((prev) => appendChunk(prev, assistantId, text));
    };

    const consume = (chunk: string) => {
      if (failed || !chunk) return;

      const next = consumeStreamText(held, chunk);
      held = next.held;
      pushText(next.visible);

      if (next.failed) {
        failed = true;
        held = "";
        setMessages((prev) =>
          updateMessage(prev, assistantId, {
            status: "error",
            error: GENERIC_ERROR,
          })
        );
      }
    };

    setMessages((prev) => [...prev, assistantMessage]);
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
        setMessages((prev) =>
          updateMessage(prev, assistantId, { status: "complete" })
        );
      }
    } catch (error) {
      if (isAbortError(error)) {
        if (held) {
          const pending = held;
          held = "";
          setMessages((prev) => appendChunk(prev, assistantId, pending));
        }

        setMessages((prev) => {
          const message = prev.find((item) => item.id === assistantId);
          if (!message || message.content === "") {
            return prev.filter((item) => item.id !== assistantId);
          }
          return updateMessage(prev, assistantId, { status: "cancelled" });
        });
        return;
      }

      const publicMessage =
        error instanceof ResponseError ? error.publicMessage : GENERIC_ERROR;

      setMessages((prev) =>
        updateMessage(prev, assistantId, {
          status: "error",
          error: publicMessage,
        })
      );
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
    const userMessage: Message = {
      id: uuid(),
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    void streamAssistantReply(withoutEmptyPlaceholders(nextMessages));
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsThinking(false);
  };

  const handleRetry = (assistantId: string) => {
    if (isThinking) return;

    const index = messages.findIndex((message) => message.id === assistantId);
    if (index === -1) return;

    const history = withoutEmptyPlaceholders(messages.slice(0, index));
    setMessages(history);
    void streamAssistantReply(history);
  };

  return (
    <div className={styles["chat-container"]}>
      {messages.length ? (
        <MessageList
          messages={messages}
          isStreaming={isThinking}
          onRetry={handleRetry}
          onRegenerate={handleRetry}
        />
      ) : (
        <EmptyState />
      )}
      <ChatInput
        onMessageSend={handleSendMessage}
        onStop={handleStop}
        isThinking={isThinking}
      />
    </div>
  )
}

export default Chat
