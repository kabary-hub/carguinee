/**
 * Badge — Étiquette réutilisable pour les statuts, labels, tags.
 *
 * Usage :
 *   <Badge variant="success">Actif</Badge>
 *   <Badge variant="warning" size="lg">En attente</Badge>
 */

import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "purple";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  default:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  info:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  purple:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1 text-sm",
};

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = "default", size = "md", className = "", children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}>
      {children}
    </span>
  );
}
