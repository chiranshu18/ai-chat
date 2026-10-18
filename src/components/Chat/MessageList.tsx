import { useEffect, useRef } from 'react'
import Message from "./Message"
import { Message as MessageType } from "@/types/chat";
import styles from './messageList.module.scss'

const NEAR_BOTTOM_PX = 80;

interface MessageListProps {
  messages: MessageType[];
  isStreaming: boolean;
}

const MessageList = ({ messages, isStreaming }: MessageListProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const shouldFollowRef = useRef(true);
  const prevLengthRef = useRef(0);
  const lastScrollTopRef = useRef(0);

  const isNearBottom = () => {
    const element = containerRef.current;
    if (!element) return true;

    return element.scrollHeight - element.scrollTop - element.clientHeight <= NEAR_BOTTOM_PX;
  };

  const handleScroll = () => {
    const element = containerRef.current;
    if (!element) return;

    const nextTop = element.scrollTop;
    if (nextTop < lastScrollTopRef.current - 1) {
      shouldFollowRef.current = false;
    } else if (isNearBottom()) {
      shouldFollowRef.current = true;
    }

    lastScrollTopRef.current = nextTop;
  };

  useEffect(() => {
    const grew = messages.length > prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (grew) {
      shouldFollowRef.current = true;
    }

    if (!shouldFollowRef.current) return;

    messageEndRef.current?.scrollIntoView({
      behavior: grew ? "smooth" : isStreaming ? "auto" : "smooth",
    });
  }, [messages, isStreaming]);

  return (
    <div
      ref={containerRef}
      className={styles['ml-container']}
      onScroll={handleScroll}
    >
      {messages.map((message) => {
        return (
          <Message key={message.id} message={message} />
        )
      })}
      <div ref={messageEndRef} />
    </div>
  )
}

export default MessageList
