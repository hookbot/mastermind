"use client";
import { useRouter } from "next/navigation";
import { FaPlay, FaGear } from "react-icons/fa6";
import styles from "./page.module.css";

export default function Home() {
   const router = useRouter();
   return (
      <div className={`${styles.page} ${styles.centered}`}>
         <main className={styles.main}>
            <h1 style={{ fontWeight: 700, fontSize: 180, letterSpacing: -11.5 }}>MASTERMIND</h1>
            <div className={styles["cta-row"]}>
               <button
                  className={styles["cta-icon-btn"]}
                  aria-label="Play"
                  onClick={() => router.push("/game")}
               >
                  <FaPlay />
               </button>
               <button
                  className={styles["cta-icon-btn"]}
                  aria-label="Settings"
                  onClick={() => router.push("/settings")}
               >
                  <FaGear />
               </button>
            </div>
         </main>
      </div>
   );
}
