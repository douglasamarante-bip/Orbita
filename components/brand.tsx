// Identidade visual Postou — fonte única para nome, slogan e símbolo.
// Para trocar o nome exibido no app, altere apenas BRAND.name.
export const BRAND = {
  name: "Postou",
  tagline: "Poste uma vez. Apareça em todo lugar.",
} as const;

type MarkProps = {
  size?: number;
  /** violet: fundo violeta, avião branco (fundos claros). light: fundo branco, avião violeta (fundos escuros). */
  variant?: "violet" | "light";
  className?: string;
};

export function PostouMark({ size = 32, variant = "violet", className }: MarkProps) {
  const bg = variant === "violet" ? "#5B3DF5" : "#FFFFFF";
  const fg = variant === "violet" ? "#FFFFFF" : "#5B3DF5";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Postou"
      className={className}
    >
      <rect width="64" height="64" rx="18" fill={bg} />
      <polygon points="14,33 50,14 38,50 31,37" fill={fg} />
      <path d="M31 37 L50 14" stroke={bg} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="17" cy="47" r="4.5" fill="#FF6B5A" />
    </svg>
  );
}
