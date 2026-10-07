import { useId, type ReactNode } from "react";
import styles from "./Card.module.css";

type CardProps = {
  title: string;
  /** Conteúdo à direita do título (ex.: botão "Limpar"). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Painel da área do usuário: fundo, borda e título com o losango do rubi. */
export function Card({ title, aside, children, className }: CardProps) {
  const titleId = useId();

  return (
    <section className={className ? `${styles.card} ${className}` : styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
