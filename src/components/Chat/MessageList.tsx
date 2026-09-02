import { useEffect, useRef } from 'react'
import Message from "./Message"
import { Message as MessageType } from "@/types/chat";
import styles from './messageList.module.scss'
import styles2 from './message.module.scss'

interface MessageListProps {
  messages: MessageType[];
  isThinking: boolean;
}

const MessageList = ({ messages, isThinking }: MessageListProps) => {
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
      {isThinking &&
        <div className={`${styles2['msg-container']} ${styles2['msg-assistant']} ${styles2['thinking']}`}>
          <div className={styles2['msg-wrapper']}>Thinking...</div>
        </div>
      }
      <div ref={messageEndRef} />
    </div>
  )
}

export default MessageList