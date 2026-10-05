import { footerConfig } from "./footer.config";
import styles from "./Footer.module.css";

export function Footer() {
  const { text, link } = footerConfig;
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        {text} ·{" "}
        <a
          href={link.href}
          className={styles.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </a>
      </p>
    </footer>
  );
}