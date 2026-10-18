import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Message as MessageType } from "@/types/chat"
import styles from "./message.module.scss"

interface MessageProps {
  message: MessageType
  isStreaming: boolean
  canRegenerate: boolean
  onRetry: (id: string) => void
  onRegenerate: (id: string) => void
}

const Message = ({ message, isStreaming, canRegenerate, onRetry, onRegenerate }: MessageProps) => {
  const isUser = message.role === "user"
  const isError = !isUser && message.status === "error"
  const showThinking =
    !isUser &&
    !message.content &&
    message.status !== "error" &&
    message.status !== "complete" &&
    message.status !== "cancelled"

  return (
    <div className={`${styles['msg-container']} ${isUser ? styles['msg-user'] : styles['msg-assistant']}`}>
      <div className={`${styles['msg-wrapper']} ${showThinking ? styles.thinking : ""}`}>
        {showThinking ? (
          "Thinking..."
        ) : isUser ? (
          message.content
        ) : (
          <>
            {message.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            ) : null}
            {isError ? (
              <div className={styles.error}>
                <p>{message.error || "Something went wrong"}</p>
                <button
                  type="button"
                  onClick={() => onRetry(message.id)}
                  disabled={isStreaming}
                >
                  Retry
                </button>
              </div>
            ) : null}
            {canRegenerate ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => onRegenerate(message.id)}
                  disabled={isStreaming}
                >
                  Regenerate
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export default Message
