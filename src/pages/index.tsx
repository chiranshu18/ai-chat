import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Layout/Header"
import Chat from "@/components/Chat/Chat"
import styles from "./styles.module.scss"


export default function Home() {
  return (
    <div className={styles['page-container']}>
      <Header />
      <Chat />
    </div>
  );
}
