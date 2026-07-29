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
    const newMsg: Message = {
      id: (messages.length + 1).toString(),
      role: "user" as const,
      content: text
    }
    setMessages((prev) => [...prev, newMsg])

    // append a mock response
    const newResponse: Message = {
      id: (messages.length + 1).toString(),
      role: "assistant" as const,
      content: 'This is a mock response.'
    }
    setMessages((prev) => [...prev, newResponse])
  }

  useEffect(() => {
    if (messages.length) {
      console.log(messages)
    }
  }, [messages])

  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} /> : <EmptyState />}
      <ChatInput onMessageSend={handleSendMessage} />
    </div>
  )
}

export default Chat