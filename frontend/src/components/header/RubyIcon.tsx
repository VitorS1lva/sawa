type RubyIconProps = { className?: string };

/** Ícone de rubi em traço, usado no menu (herda a cor via `currentColor`). */
export function RubyIcon({ className }: RubyIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3h12l4 6-10 12L2 9l4-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2 9h20M9 3 7.5 9 12 21M15 3l1.5 6L12 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
