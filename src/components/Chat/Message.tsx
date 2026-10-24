import { isValidElement, memo, useEffect, useState, type ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Message as MessageType } from "@/types/chat"
import CodeBlock, { ShowCodeCopy } from "./CodeBlock"
import CopyButton from "./CopyButton"
import styles from "./message.module.scss"

function blockText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (Array.isArray(value)) return value.map(blockText).join("")
  return ""
}

const markdownComponents: Components = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children
    if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      return <pre>{children}</pre>
    }

    const className = child.props.className ?? ""
    const language = /language-(\S+)/.exec(className)?.[1] ?? null
    const code = blockText(child.props.children).replace(/\n$/, "")
    return <CodeBlock code={code} language={language} />
  },
  code({ children }) {
    return <code className={styles.inline}>{children}</code>
  },
}

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
  const canCopyResponse = !isUser && Boolean(message.content) && message.status !== "streaming"

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
              <ShowCodeCopy.Provider value={message.status !== "streaming"}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </ShowCodeCopy.Provider>
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
            {canCopyResponse || canRegenerate ? (
              <div className={styles.actions}>
                {canCopyResponse ? (
                  <CopyButton
                    text={message.content}
                    idle="Copy response"
                    failedClassName={styles["copy-failed"]}
                  />
                ) : null}
                {canRegenerate ? (
                  <button
                    type="button"
                    onClick={() => onRegenerate(message.id)}
                    disabled={isStreaming}
                  >
                    Regenerate
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function sameMessage(prev: MessageProps, next: MessageProps) {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.status === next.message.status &&
    prev.message.error === next.message.error &&
    prev.isStreaming === next.isStreaming &&
    prev.canRegenerate === next.canRegenerate
  )
}

export default memo(Message, sameMessage)
