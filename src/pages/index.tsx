import { useRef } from "react";
import Header from "@/components/Layout/Header"
import Chat from "@/components/Chat/Chat"
import styles from "./styles.module.scss"


export default function Home() {
  const newChatRef = useRef<() => void>(() => {});

  return (
    <div className={styles['page-container']}>
      <Header onNewChat={() => newChatRef.current()} />
      <Chat onRegisterNewChat={(newChat) => {
        newChatRef.current = newChat;
      }} />
    </div>
  );
}
