/**
 * EmptyState — Affichage quand il n'y a rien à montrer.
 *
 * Usage :
 *   <EmptyState title="Aucune réservation" description="Réservez un véhicule pour commencer." />
 *   <EmptyState title="Aucun résultat" action={<Button onClick={reset}>Réinitialiser</Button>} />
 */

import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
