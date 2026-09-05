import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Message as MessageType } from "@/types/chat"
import styles from "./message.module.scss"

interface MessageProps {
  message: MessageType
}

const Message = ({ message }: MessageProps) => {
  const isUser = message.role === "user"

  return (
    <div className={`${styles['msg-container']} ${isUser ? styles['msg-user'] : styles['msg-assistant']}`}>
      <div className={styles['msg-wrapper']}>
        {!isUser && !message.content ? (
          "Thinking..."
        ) : isUser ? (
          message.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

export default Message