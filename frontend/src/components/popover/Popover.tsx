"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Popover.module.css";

type PopoverProps = {
  id: string;
  title: string;
  children: ReactNode;
};

/** Balão que aparece abaixo de um botão do menu. */
export function Popover({ id, title, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Ao abrir, coloca o foco no primeiro campo (facilita o uso pelo teclado).
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-labelledby={`${id}-title`}
      className={styles.popover}
    >
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      {children}
    </div>
  );
}
