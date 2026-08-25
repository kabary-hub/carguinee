/**
 * Button — Composant réutilisable avec variants.
 *
 * Usage :
 *   <Button variant="primary">Confirmer</Button>
 *   <Button variant="danger" size="sm">Supprimer</Button>
 *   <Button variant="ghost" loading>Chargement...</Button>
 */

import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "orange";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/30",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
  danger:
    "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-500/10",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  orange:
    "bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
