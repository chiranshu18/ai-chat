import { useState } from "react";
import Header from "@/components/Layout/Header"
import Chat from "@/components/Chat/Chat"
import styles from "./styles.module.scss"


export default function Home() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className={styles['page-container']}>
      <Header onNewChat={() => setResetKey((key) => key + 1)} />
      <Chat key={resetKey} />
    </div>
  );
}
