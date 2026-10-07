"use client";

import { useId } from "react";
import { Card } from "@/components/card/Card";
// Mesma caixinha das listas de bolsas e ações.
import checkStyles from "@/components/check-list/CheckList.module.css";
import styles from "./ScopeSwitch.module.css";

export type ScopeOption<T extends string> = { id: T; label: string };

type ScopeSwitchProps<T extends string> = {
  options: ScopeOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nome lido por leitores de tela (a seção não tem título visível). */
  label: string;
};

/** Seção pequena, sem título, para escolher o que a área do usuário mostra (só uma opção por vez). */
export function ScopeSwitch<T extends string>({ options, value, onChange, label }: ScopeSwitchProps<T>) {
  const name = useId();

  return (
    <Card className={styles.card}>
      <fieldset className={styles.group} aria-label={label}>
        {options.map((option) => (
          <label key={option.id} className={styles.option}>
            <input
              className={checkStyles.input}
              type="radio"
              name={name}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span className={checkStyles.box} aria-hidden="true" />
            {option.label}
          </label>
        ))}
      </fieldset>
    </Card>
  );
}
