import { useEffect, useState } from "react"
import { v4 as uuid } from "uuid";

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"
import { Message } from "@/types/chat"

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsthinking] = useState<boolean>(false)

  const handleSendMessage = async (text: string) => {
    // append user message and mock response
    const newMsg = {
      id: uuid(),
      role: "user" as const,
      content: text
    }

    const updatedMessages = [...messages, newMsg];

    // show the user's message immediately
    setMessages(updatedMessages);
    setIsthinking(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: uuid(),
        role: "assistant",
        content: data.message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsthinking(false);
    }
  }

  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} isThinking={isThinking} /> : <EmptyState />}
      <ChatInput onMessageSend={handleSendMessage} isThinking={isThinking} />
    </div>
  )
}

export default Chat