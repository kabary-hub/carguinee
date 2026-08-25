/**
 * Card — Conteneur réutilisable pour les sections.
 *
 * Usage :
 *   <Card>Contenu simple</Card>
 *   <Card variant="highlight">Contenu mis en avant</Card>
 *   <Card padding="sm">Compact</Card>
 */

import type { ReactNode } from "react";

type Variant = "default" | "highlight" | "interactive";
type Padding = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  default:
    "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
  highlight:
    "border-2 border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-500/5",
  interactive:
    "border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
};

const PADDING_CLASSES: Record<Padding, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

interface CardProps {
  variant?: Variant;
  padding?: Padding;
  className?: string;
  children: ReactNode;
}

export function Card({ variant = "default", padding = "md", className = "", children }: CardProps) {
  return (
    <div className={`rounded-2xl shadow-sm ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${className}`}>
      {children}
    </div>
  );
}
