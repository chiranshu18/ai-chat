import { useState } from "react"

import MessageList from "./MessageList"
import EmptyState from "./EmptyState"
import ChatInput from "./ChatInput"

import styles from "./Chat.module.scss"

const Chat = () => {
  const [messages, setMessages] = useState([])
  return (
    <div className={styles["chat-container"]}>
      {messages?.length ? <MessageList messages={messages} /> : <EmptyState />}
      <ChatInput />
    </div>
  )
}

export default Chat