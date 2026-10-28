import React, { useEffect, useRef, useState } from 'react'
import styles from "./chatInput.module.scss"
import { FileText, Paperclip, SendHorizontal, Square } from 'lucide-react'
import {
  DEFAULT_DOCUMENT_QUESTION,
  DOCUMENT_UNREADABLE,
  documentFileError,
} from '@/lib/document'

interface ChatInputProps {
  onMessageSend: (message: string, file: File | null) => Promise<void>;
  onStop: () => void;
  isThinking: boolean;
}

const MAX_HEIGHT = 160

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = "auto"
  const next = Math.min(element.scrollHeight, MAX_HEIGHT)
  element.style.height = `${next}px`
}

const ChatInput = ({ onMessageSend, onStop, isThinking }: ChatInputProps) => {
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!textareaRef.current) return
    resizeTextarea(textareaRef.current)
  }, [query])

  const handleSend = async () => {
    if (isThinking || isReading) return;
    const trimmed = query.trim();
    if (!trimmed && !file) return;

    if (file) {
      const problem = documentFileError(file);
      if (problem) {
        setError(problem);
        return;
      }
    }

    setError(null);
    setIsReading(true);
    try {
      await onMessageSend(trimmed || DEFAULT_DOCUMENT_QUESTION, file);
      setQuery('');
      setFile(null);
    } catch (sendError) {
      const message = sendError instanceof Error && sendError.message
        ? sendError.message
        : DOCUMENT_UNREADABLE;
      setError(message);
    } finally {
      setIsReading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter key (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) return;

    const problem = documentFileError(next);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setFile(next);
  };

  return (
    <div className={styles.composer}>
      {file ? (
        <div className={styles.file}>
          <FileText size={14} aria-hidden="true" />
          <span>{file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            disabled={isReading}
          >
            Remove
          </button>
        </div>
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles['ci-container']}>
        <button
          type="button"
          className={styles.attach}
          onClick={() => fileInputRef.current?.click()}
          disabled={isThinking || isReading}
          aria-label="Attach a document"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          className={styles.hidden}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          onChange={handleFileChange}
        />
        <textarea
          ref={textareaRef}
          value={query}
          placeholder='Ask anything!'
          rows={1}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {isThinking ? (
          <button
            type="button"
            className={styles["send-button"]}
            onClick={onStop}
            aria-label="Stop generating"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            className={styles["send-button"]}
            onClick={() => void handleSend()}
            disabled={isReading}
            aria-label="Send message"
          >
            <SendHorizontal />
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatInput
