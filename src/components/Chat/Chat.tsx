import { useState } from "react"
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
    const newMsg = {
      id: uuid(),
      role: "user" as const,
      content: text
    };

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

        const chunk = decoder.decode(value);

        console.log("chunk: ", chunk);
      }

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsthinking(false);
    }
  };

  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} isThinking={isThinking} /> : <EmptyState />}
      <ChatInput onMessageSend={handleSendMessage} isThinking={isThinking} />
    </div>
  )
}

export default Chat