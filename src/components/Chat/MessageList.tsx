import React from 'react'
import Message from "./Message"
import styles from './messageList.module.scss'
import { Message as MessageType } from "@/types/chat";

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className={styles['ml-container']}>
      {messages?.map((item: any, index: number) => {
        return (
          <Message key={item.id} />
        )
      })}
    </div>
  )
}

export default MessageList