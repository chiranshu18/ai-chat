import React, { useState } from 'react'
import styles from "./chatInput.module.scss"
import { SendHorizontal, Square } from 'lucide-react'

interface ChatInputProps {
  onMessageSend: (message: string) => void;
  onStop: () => void;
  isThinking: boolean;
}

const ChatInput = ({ onMessageSend, onStop, isThinking }: ChatInputProps) => {
  const [query, setQuery] = useState('');

  const handleSend = () => {
    if (isThinking) return;
    if (!query.trim()) return;

    onMessageSend(query);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter key (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles['ci-container']}>
      <textarea
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
          onClick={handleSend}
          aria-label="Send message"
        >
          <SendHorizontal />
        </button>
      )}
    </div>
  )
}

export default ChatInput
