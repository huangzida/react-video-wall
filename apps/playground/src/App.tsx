import { useState } from "react";
import { Rocket, Sun, Moon, Hash } from "lucide-react";
import { Counter } from "react-lib";
import styles from "./App.module.css";

export function App() {
  const [dark, setDark] = useState(false);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    // ADR-0004: dark mode is class-driven via `.dark` on <html>.
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Rocket size={26} className={styles.logo} />
          <div className={styles.title}>
            <h1>starter-react</h1>
            <p>playground · 消费者视角演示</p>
          </div>
          <button className={styles.toggle} onClick={toggle} aria-label="切换主题">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{dark ? "亮色" : "暗色"}</span>
          </button>
        </header>

        <section className={styles.demo}>
          <h2>
            <Hash size={15} /> Counter
          </h2>
          <Counter initial={5} step={2} />
          <p className={styles.caption}>
            来自 <code className={styles.code}>react-lib</code> 的示例组件 · 主题由 CSS 变量驱动
          </p>
        </section>
      </div>
    </main>
  );
}
