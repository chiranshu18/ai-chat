import { useEffect, useRef, useState } from "react"
import { v4 as uuid } from "uuid";

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"
import { Message } from "@/types/chat"

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
    };
    const assistantId = assistantMessage.id;

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
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Response body is not available");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => appendChunk(prev, assistantId, chunk));
      }

      const tail = decoder.decode();
      setMessages((prev) => appendChunk(prev, assistantId, tail));
    } catch (error) {
      if (isAbortError(error)) {
        setMessages((prev) => {
          const message = prev.find((item) => item.id === assistantId);
          if (message && message.content === "") {
            return prev.filter((item) => item.id !== assistantId);
          }
          return prev;
        });
        return;
      }

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
    const history = [...messages, userMessage].filter(
      (message) => !(message.role === "assistant" && message.content === "")
    );

    setMessages(history);
    void streamAssistantReply(history);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsThinking(false);
  };

  return (
    <div className={styles["chat-container"]}>
      {messages.length ? (
        <MessageList messages={messages} isStreaming={isThinking} />
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
