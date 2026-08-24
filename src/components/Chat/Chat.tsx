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

    setMessages((prev) => [...prev, newMsg]);
    setIsthinking(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, newResponse])
      setIsthinking(false)
    }, 3000)
  }

  useEffect(() => {
    console.log(messages)
  }, [messages])

  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} isThinking={isThinking}/> : <EmptyState />}
      <ChatInput onMessageSend={handleSendMessage} isThinking={isThinking} />
    </div>
  )
}

export default Chat