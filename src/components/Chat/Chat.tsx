import { useEffect, useState } from "react"

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"
import { Message } from "@/types/chat"

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = (text: string) => {
    // append user message
    setMessages((prev) => [
      ...prev, {
        id: (prev.length + 1).toString(),
        role: "user" as const,
        content: text
      }
    ])

    // append a mock response
    setMessages((prev) => [
      ...prev, {
        id: (prev.length + 1).toString(),
        role: "assistant" as const,
        content: 'This is a mock response.'
      }
    ])
  }

  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} /> : <EmptyState />}
      <ChatInput onMessageSend={handleSendMessage} />
    </div>
  )
}

export default Chat