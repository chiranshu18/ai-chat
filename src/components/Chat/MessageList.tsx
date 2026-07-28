import React from 'react'
import Message from "./Message"
import styles from './messageList.module.scss'

interface MessageListProps {
  messages: any[]
}

const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className={styles['ml-container']}>
      {messages?.map((item: any, index: number) => {
        return (
          <Message key={index} />
        )
      })}
    </div>
  )
}

export default MessageList