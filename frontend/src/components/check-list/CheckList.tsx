"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import styles from "./CheckList.module.css";

export type CheckListItem = {
  id: string;
  label: string;
  /** Texto menor ao lado do rótulo (ex.: nome da empresa). */
  description?: string;
};

type CheckListProps = {
  title: string;
  items: CheckListItem[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** `false` (padrão) permite marcar só um item. */
  multiple?: boolean;
  /** Limite de itens marcados; os demais ficam desabilitados ao atingi-lo. */
  max?: number;
  searchPlaceholder?: string;
  /** Cor de cada item marcado, para ligar a lista às linhas do gráfico. */
  colors?: Record<string, string>;
  isLoading?: boolean;
  error?: string | null;
  emptyText: string;
  className?: string;
};

/** Ignora maiúsculas e acentos ao filtrar ("itau" encontra "Itaú"). */
function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Lista de opções marcáveis com campo de busca. */
export function CheckList({
  title,
  items,
  selected,
  onChange,
  multiple = false,
  max,
  searchPlaceholder = "Buscar...",
  colors,
  isLoading = false,
  error = null,
  emptyText,
  className,
}: CheckListProps) {
  const [query, setQuery] = useState("");
  const titleId = useId();
  const name = useId();

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return items;
    return items.filter((item) => normalize(`${item.label} ${item.description ?? ""}`).includes(term));
  }, [items, query]);

  const limitReached = multiple && max !== undefined && selected.length >= max;

  function toggle(id: string) {
    if (!multiple) {
      onChange([id]);
    } else if (selected.includes(id)) {
      onChange(selected.filter((value) => value !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  let body;
  if (isLoading) {
    body = <p className={styles.status}>Carregando...</p>;
  } else if (error) {
    body = (
      <p className={styles.status} role="alert">
        {error}
      </p>
    );
  } else if (filtered.length === 0) {
    body = <p className={styles.status}>{query ? "Nada encontrado." : emptyText}</p>;
  } else {
    body = (
      <ul className={styles.list}>
        {filtered.map((item) => {
          const checked = selected.includes(item.id);
          const color = checked ? colors?.[item.id] : undefined;

          return (
            <li key={item.id}>
              <label className={styles.item} data-disabled={!checked && limitReached}>
                <input
                  className={styles.input}
                  type={multiple ? "checkbox" : "radio"}
                  name={name}
                  checked={checked}
                  disabled={!checked && limitReached}
                  onChange={() => toggle(item.id)}
                />
                <span className={styles.box} aria-hidden="true" />
                <span className={styles.label}>{item.label}</span>
                {item.description && <span className={styles.description}>{item.description}</span>}
                {color && <span className={styles.swatch} style={{ backgroundColor: color }} aria-hidden="true" />}
              </label>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className={className ? `${styles.panel} ${className}` : styles.panel} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {multiple && selected.length > 0 && (
          <button type="button" className={styles.clear} onClick={() => onChange([])}>
            Limpar ({selected.length})
          </button>
        )}
      </header>

      <div className={styles.search}>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          className={styles.searchInput}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={`Filtrar ${title.toLowerCase()}`}
        />
      </div>

      {limitReached && <p className={styles.hint}>Limite de {max} itens marcados.</p>}

      <div className={styles.scroll}>{body}</div>
    </section>
  );
}
