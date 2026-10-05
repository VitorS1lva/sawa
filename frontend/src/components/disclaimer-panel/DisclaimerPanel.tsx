import { disclaimerPanel } from "./DisclaimerPanel.configs";
import styles from "./DisclaimerPanel.module.css";

export function DisclaimerPanel() {
  return (
    <div className={styles.text}>
      {disclaimerPanel.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}
