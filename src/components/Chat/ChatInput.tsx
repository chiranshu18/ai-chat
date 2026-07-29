import React, { useState } from 'react'
import styles from "./chatInput.module.scss"
import { SendHorizontal } from 'lucide-react'

interface ChatInputProps {
  onMessageSend: (message: string) => void;
}

const ChatInput = ({ onMessageSend }: ChatInputProps) => {
  const [query, setQuery] = useState('');

  const handleSend = () => {
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
      <SendHorizontal className={styles["send-button"]} onClick={handleSend} />
    </div>
  )
}

export default ChatInput