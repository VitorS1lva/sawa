import styles from "./MenuPanels.module.css";

/** Balão com parágrafos de texto (ex.: Sobre, Disclaimer). */
export function TextPanel({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className={styles.text}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

/** Balão com uma introdução e uma lista com marcadores (ex.: Features). */
export function ListPanel({ intro, items }: { intro: string; items: string[] }) {
  return (
    <div>
      <p className={styles.intro}>{intro}</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item} className={styles.item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
