import { featuresFuturasPanel } from "./FeaturesFuturasPanel.configs";
import styles from "./FeaturesFuturasPanel.module.css";

export function FeaturesFuturasPanel() {
  return (
    <div className={styles.text}>
      <p className={styles.intro}>{featuresFuturasPanel.intro}</p>

      <ul className={styles.list}>
        {featuresFuturasPanel.items.map((item) => (
          <li key={item} className={styles.item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}