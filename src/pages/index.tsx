import { useRef, useState } from "react";
import Sidebar from "@/components/Layout/Sidebar"
import Chat, { ChatActions } from "@/components/Chat/Chat"
import { ChatStore } from "@/types/chat"
import styles from "./styles.module.scss"

export default function Home() {
  const actionsRef = useRef<ChatActions>({
    newChat: () => {},
    select: () => {},
    deleteConversation: () => {},
  });
  const [store, setStore] = useState<ChatStore | null>(null);

  return (
    <div className={styles['page-container']}>
      <Sidebar
        conversations={store?.conversations ?? []}
        activeId={store?.activeId ?? ""}
        onNewChat={() => actionsRef.current.newChat()}
        onSelect={(id) => actionsRef.current.select(id)}
        onDelete={(id) => actionsRef.current.deleteConversation(id)}
      />
      <div className={styles['main-column']}>
        <Chat
          onRegisterActions={(actions) => {
            actionsRef.current = actions;
          }}
          onStoreChange={setStore}
        />
      </div>
    </div>
  );
}
