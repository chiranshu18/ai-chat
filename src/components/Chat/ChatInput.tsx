import React from 'react'
import styles from "./chatInput.module.scss"

import { SendHorizontal } from 'lucide-react'

// TO DO LATER
// 1. Inc input height with text

const ChatInput = () => {
  return (
    <div className={styles['ci-container']}>
      <input type='text' placeholder='Ask anything!' />
      <SendHorizontal />
    </div>
  )
}

export default ChatInput
