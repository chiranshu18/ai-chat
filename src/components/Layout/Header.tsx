import styles from "./header.module.scss"

interface HeaderProps {
  onNewChat: () => void
}

const Header = ({ onNewChat }: HeaderProps) => {
  return (
    <div className={styles['header-container']}>
      <span>ChatGpt</span>
      <button type="button" onClick={onNewChat}>
        New chat
      </button>
    </div>
  )
}

export default Header