import { aboutPanel } from "./AboutPanel.configs";
import styles from "./AboutPanel.module.css";

export function AboutPanel() {
  return (
    <div className={styles.text}>
      {aboutPanel.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}
