import { useEffect, useRef } from 'react'
import Message from "./Message"
import { Message as MessageType } from "@/types/chat";
import styles from './messageList.module.scss'

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const scrollIntoView = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollIntoView();
  }, [messages]);

  return (
    <div className={styles['ml-container']}>
      {messages?.map((message) => {
        return (
          <Message key={message.id} message={message} />
        )
      })}
      <div ref={messageEndRef} />
    </div>
  )
}

export default MessageList