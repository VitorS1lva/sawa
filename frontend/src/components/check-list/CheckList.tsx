"use client";

import { useId, useMemo, useState } from "react";
import { Card } from "@/components/card/Card";
import { Search, Star } from "lucide-react";
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
  /** Ids favoritados: aparecem no topo. Sem `onToggleFavorite`, a lista não mostra estrelas. */
  favorites?: string[];
  onToggleFavorite?: (id: string, favorite: boolean) => void;
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
  favorites = [],
  onToggleFavorite,
}: CheckListProps) {
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const name = useId();

  // Filtra pela busca (e, se pedido, só favoritos) e põe os favoritos no topo.
  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    const favoriteSet = new Set(favorites);
    const visible = items.filter(
      (item) =>
        (!onlyFavorites || favoriteSet.has(item.id)) &&
        (!term || normalize(`${item.label} ${item.description ?? ""}`).includes(term)),
    );
    return [...visible.filter((i) => favoriteSet.has(i.id)), ...visible.filter((i) => !favoriteSet.has(i.id))];
  }, [items, query, favorites, onlyFavorites]);

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
    let message = emptyText;
    if (query) message = "Nada encontrado.";
    else if (onlyFavorites) message = "Nenhum favorito ainda. Toque na estrela de um item para favoritá-lo.";
    body = <p className={styles.status}>{message}</p>;
  } else {
    body = (
      <ul className={styles.list}>
        {filtered.map((item) => {
          const checked = selected.includes(item.id);
          const color = checked ? colors?.[item.id] : undefined;
          const favorite = favorites.includes(item.id);

          return (
            <li key={item.id} className={styles.row}>
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
              {/* Fora do <label>, para favoritar não marcar o item. */}
              {onToggleFavorite && (
                <button
                  type="button"
                  className={styles.star}
                  aria-pressed={favorite}
                  aria-label={favorite ? `Remover ${item.label} dos favoritos` : `Favoritar ${item.label}`}
                  title={favorite ? "Remover dos favoritos" : "Favoritar"}
                  onClick={() => onToggleFavorite(item.id, !favorite)}
                >
                  <Star aria-hidden="true" fill={favorite ? "currentColor" : "none"} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card
      title={title}
      className={className}
      aside={
        multiple &&
        selected.length > 0 && (
          <button type="button" className={styles.clear} onClick={() => onChange([])}>
            Limpar ({selected.length})
          </button>
        )
      }
    >

      <div className={styles.searchRow}>
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
        {onToggleFavorite && (
          <button
            type="button"
            className={styles.favoritesFilter}
            aria-pressed={onlyFavorites}
            aria-label="Mostrar só favoritos"
            title="Mostrar só favoritos"
            onClick={() => setOnlyFavorites((value) => !value)}
          >
            <Star aria-hidden="true" fill={onlyFavorites ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {limitReached && <p className={styles.hint}>Limite de {max} itens marcados.</p>}

      <div className={styles.scroll}>{body}</div>
    </Card>
  );
}
