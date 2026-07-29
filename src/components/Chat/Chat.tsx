import { useEffect, useState } from "react"
import { v4 as uuid } from "uuid";

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"
import { Message } from "@/types/chat"

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = (text: string) => {
    // append user message and mock response
    const newMsg = {
      id: uuid(),
      role: "user" as const,
      content: text
    }

    const newResponse = {
      id: uuid(),
      role: "assistant" as const,
      content: 'This is a mock response.'
    }

    setMessages((prev) => [...prev, newMsg, newResponse])
  }

  useEffect(() => {
    console.log(messages)
  }, [messages])

  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} /> : <EmptyState />}
      <ChatInput onMessageSend={handleSendMessage} />
    </div>
  )
}

export default Chat