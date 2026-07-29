import React, { useEffect, useState } from 'react'
import styles from "./chatInput.module.scss"

import { SendHorizontal } from 'lucide-react'

interface ChatInputProps {
  onMessageSend: any
}

const ChatInput = ({ onMessageSend }: ChatInputProps) => {
  const [query, setQuery] = useState('');

  return (
    <div className={styles['ci-container']}>
      <input type='text' placeholder='Ask anything!' onChange={(e) => setQuery(e.target.value)} />
      <SendHorizontal onClick={() => {
        onMessageSend(query);
      }} />
    </div>
  )
}

export default ChatInput
