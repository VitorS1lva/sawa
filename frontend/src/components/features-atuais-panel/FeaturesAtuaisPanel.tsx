import { featuresAtuaisPanel } from "./FeaturesAtuaisPanel.configs";
import styles from "./FeaturesAtuaisPanel.module.css";

export function FeaturesAtuaisPanel() {
  return (
    <div className={styles.text}>
      <p className={styles.intro}>{featuresAtuaisPanel.intro}</p>

      <ul className={styles.list}>
        {featuresAtuaisPanel.items.map((item) => (
          <li key={item} className={styles.item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}