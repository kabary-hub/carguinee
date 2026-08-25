/**
 * Input — Composant input réutilisable avec label et message d'erreur.
 *
 * Usage :
 *   <Input label="Nom" placeholder="Votre nom" error="Champ requis" />
 *   <Input type="email" required />
 */

import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:focus:border-emerald-500"
          } bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
