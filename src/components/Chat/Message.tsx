import { useEffect, useState } from "react"
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
  onEdit: (id: string, nextText: string) => void
}

const Message = ({
  message,
  isStreaming,
  canRegenerate,
  onRetry,
  onRegenerate,
  onEdit,
}: MessageProps) => {
  const isUser = message.role === "user"
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const isError = !isUser && message.status === "error"
  const showThinking =
    !isUser &&
    !message.content &&
    message.status !== "error" &&
    message.status !== "complete" &&
    message.status !== "cancelled"
  const canEdit = isUser && !isStreaming && !isEditing

  useEffect(() => {
    if (!isStreaming) return
    setIsEditing(false)
    setDraft(message.content)
  }, [isStreaming, message.content])

  const startEdit = () => {
    if (isStreaming) return
    setDraft(message.content)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(message.content)
    setIsEditing(false)
  }

  const saveEdit = () => {
    const nextText = draft.trim()
    if (!nextText || isStreaming) return
    onEdit(message.id, nextText)
    setIsEditing(false)
  }

  return (
    <div className={`${styles['msg-container']} ${isUser ? styles['msg-user'] : styles['msg-assistant']}`}>
      <div className={`${styles['msg-wrapper']} ${showThinking ? styles.thinking : ""} ${isEditing ? styles.editing : ""}`}>
        {showThinking ? (
          "Thinking..."
        ) : isEditing ? (
          <>
            <textarea
              className={styles['edit-input']}
              value={draft}
              rows={3}
              aria-label="Edit message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault()
                  cancelEdit()
                }
              }}
            />
            <div className={styles.actions}>
              <button type="button" onClick={saveEdit} disabled={!draft.trim()}>
                Save
              </button>
              <button type="button" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </>
        ) : isUser ? (
          <>
            {message.content}
            {canEdit ? (
              <div className={styles.actions}>
                <button type="button" onClick={startEdit}>
                  Edit
                </button>
              </div>
            ) : null}
          </>
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
