import React, { useEffect, useState } from 'react'
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles['ci-container']}>
      <input
        type='text'
        value={query}
        placeholder='Ask anything!'
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <SendHorizontal className={styles["send-button"]} onClick={handleSend} />
    </div>
  )
}

export default ChatInput
