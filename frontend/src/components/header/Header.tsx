"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, Menu, X } from "lucide-react";
import { Popover } from "@/components/popover/Popover";
import { headerConfig, type HeaderItem } from "./header.config";
import { RubyViewer } from "@/components/ruby/RubyViewer";
import { useMediaQuery } from "@/lib/useMediaQuery";
import styles from "./Header.module.css";

/** Título e conteúdo de um balão. */
export type HeaderPanel = { title: string; content: ReactNode };

type HeaderProps = {
  items: HeaderItem[];
  /**
   * Balões de cada item, pelo `id`. Recebe uma função para trocar de balão
   * (ex.: do login para o cadastro). Itens sem balão chamam `onAction`.
   */
  panels: (openPanel: (id: string) => void) => Partial<Record<string, HeaderPanel>>;
  onAction?: (id: string) => void;
  /** Para onde o logo leva. */
  brandHref?: string;
};

/**
 * Menu principal suspenso.
 * Cada botão abre um balão em vez de navegar para outra página.
 * Apenas um balão fica aberto por vez; clicar fora ou apertar Esc fecha.
 *
 * No celular e no tablet em pé, os botões ficam numa gaveta aberta pelo botão hambúrguer.
 * Tocar num item mostra o conteúdo do balão dentro da própria gaveta, com um botão de voltar.
 *
 * Os itens e balões vêm por props; veja LandingHeader e UserHeader.
 */
export function Header({ items, panels: getPanels, onAction, brandHref = "/" }: HeaderProps) {
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery(headerConfig.mobileQuery);
  const barRef = useRef<HTMLDivElement>(null);

  const sheetOpen = isMobile && menuOpen;

  function closeAll() {
    setOpenPanel(null);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!openPanel && !menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
        setMenuOpen(false);
      }
    }

    // Na gaveta, o Esc primeiro volta para a lista; no desktop, fecha o balão.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (menuOpen && openPanel) setOpenPanel(null);
      else {
        setOpenPanel(null);
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPanel, menuOpen]);

  const panels = getPanels(setOpenPanel);
  const currentPanel = openPanel ? panels[openPanel] : undefined;

  /** Abre o balão do item ou, se ele não tiver balão, executa a ação (ex.: sair). */
  function select(id: string, toggle: boolean) {
    if (panels[id]) {
      setOpenPanel(toggle && openPanel === id ? null : id);
    } else {
      closeAll();
      onAction?.(id);
    }
  }

  return (
    <header className={styles.header}>
      <div ref={barRef} className={styles.bar}>
        <a href={brandHref} className={styles.brand} aria-label={headerConfig.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <RubyViewer />
          </span>
          <span className={styles.brandName}>{headerConfig.brand}</span>
        </a>

        <nav className={styles.nav} aria-label="Menu principal">
          {items.map((item) => {
            const panel = panels[item.id];
            const isOpen = openPanel === item.id;
            const popoverId = `popover-${item.id}`;

            return (
              <div key={item.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.button}
                  data-accent={item.accent}
                  aria-expanded={panel ? isOpen : undefined}
                  aria-controls={panel ? popoverId : undefined}
                  onClick={() => select(item.id, true)}
                >
                  {item.label}
                </button>

                {panel && isOpen && !isMobile && (
                  <Popover id={popoverId} title={panel.title}>
                    {panel.content}
                  </Popover>
                )}
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={sheetOpen}
          aria-controls="menu-mobile"
          aria-label={sheetOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => (sheetOpen ? closeAll() : setMenuOpen(true))}
        >
          {sheetOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        {sheetOpen && (
          <div id="menu-mobile" className={styles.sheet}>
            {openPanel && currentPanel ? (
              <>
                <button type="button" className={styles.back} onClick={() => setOpenPanel(null)}>
                  <ChevronLeft aria-hidden="true" />
                  Menu
                </button>
                <Popover id={`popover-${openPanel}`} title={currentPanel.title} inline>
                  {currentPanel.content}
                </Popover>
              </>
            ) : (
              <nav className={styles.sheetNav} aria-label="Menu principal">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.sheetItem}
                    data-accent={item.accent}
                    onClick={() => select(item.id, false)}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
