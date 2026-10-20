import { Trash2 } from "lucide-react"

import { Conversation } from "@/types/chat"
import styles from "./sidebar.module.scss"

interface SidebarProps {
  conversations: Conversation[]
  activeId: string
  onNewChat: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

const Sidebar = ({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
}: SidebarProps) => {
  const rows = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <aside className={styles.sidebar} aria-label="Conversations">
      <button type="button" className={styles["new-chat"]} onClick={onNewChat}>
        New chat
      </button>
      <div className={styles.list}>
        {rows.map((conversation) => {
          const isActive = conversation.id === activeId

          return (
            <div
              key={conversation.id}
              className={`${styles.row} ${isActive ? styles.active : ""}`}
            >
              <button
                type="button"
                className={styles.title}
                title={conversation.title}
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(conversation.id)}
              >
                {conversation.title}
              </button>
              <button
                type="button"
                className={styles.delete}
                aria-label={`Delete ${conversation.title}`}
                onClick={() => onDelete(conversation.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
