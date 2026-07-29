import Message from "./Message"
import { Message as MessageType } from "@/types/chat";
import styles from './messageList.module.scss'

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className={styles['ml-container']}>
      {messages?.map((message: any) => {
        return (
          <Message key={message.id} message={message} />
        )
      })}
    </div>
  )
}

export default MessageList