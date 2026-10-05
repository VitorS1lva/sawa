import { RubyViewer } from "@/components/ruby/RubyViewer";
import { heroConfig } from "./hero.config";
import styles from "./Hero.module.css";

/** Área central: rubi 3D girando e o nome do site. */
export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.model} aria-hidden="true">
        <RubyViewer/>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>{heroConfig.title}</h1>
        {heroConfig.subtitle && <p className={styles.subtitle}>{heroConfig.subtitle}</p>}
      </div>
    </section>
  );
}
