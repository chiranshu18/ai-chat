import { useState } from "react"

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"
import { Message } from "@/types/chat"

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} /> : <EmptyState />}
      <ChatInput />
    </div>
  )
}

export default Chat