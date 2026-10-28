import styles from "./emptyState.module.scss"

const EmptyState = () => {
  return (
    <div className={styles["el-container"]}>
      <h1>How can I help you today?</h1>
      <p>Ask a question, or attach a PDF or text file.</p>
    </div>
  )
}

export default EmptyState
