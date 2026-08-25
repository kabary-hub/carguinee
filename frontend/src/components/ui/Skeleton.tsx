/**
 * Skeleton — Composants de chargement animés (pulse).
 *
 * Utilisation :
 *   import { SkeletonBar, SkeletonCard, SkeletonCircle } from "../ui";
 *
 *   <SkeletonBar width="70%" height={16} />
 *   <SkeletonCard lines={3} />
 *   <SkeletonCircle size={40} />
 */

import type { CSSProperties } from "react";

// ── Barre de base ──────────────────────────────────────────────────────────

interface SkeletonBarProps {
  width?: string | number;
  height?: number;
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

const roundedMap = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function SkeletonBar({
  width = "100%",
  height = 14,
  className = "",
  rounded = "md",
}: SkeletonBarProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 ${roundedMap[rounded]} ${className}`}
      style={{ width: typeof width === "number" ? `${width}px` : width, height }}
    />
  );
}

// ── Cercle ─────────────────────────────────────────────────────────────────

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export function SkeletonCircle({ size = 40, className = "" }: SkeletonCircleProps) {
  return (
    <div
      className={`animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ── Carte skeleton ─────────────────────────────────────────────────────────

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  /** Largeurs des lignes en pourcentage (ex: ["100%", "80%", "60%"]) */
  lineWidths?: string[];
}

export function SkeletonCard({ lines = 3, lineWidths, className = "" }: SkeletonCardProps) {
  const widths = lineWidths ?? ["100%", "85%", "65%"];
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar key={i} width={widths[i % widths.length]} height={14} />
      ))}
    </div>
  );
}

// ── Carte avec en-tête ─────────────────────────────────────────────────────

interface SkeletonCardBlockProps {
  className?: string;
}

export function SkeletonCardBlock({ className = "" }: SkeletonCardBlockProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <SkeletonBar width="40%" height={16} className="mb-4" />
      <SkeletonCard lines={2} lineWidths={["100%", "70%"]} />
    </div>
  );
}

// ── Ligne de liste skeleton ────────────────────────────────────────────────

interface SkeletonListRowProps {
  className?: string;
}

export function SkeletonListRow({ className = "" }: SkeletonListRowProps) {
  return (
    <div className={`flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 ${className}`}>
      <SkeletonCircle size={40} />
      <div className="flex-1 space-y-2">
        <SkeletonBar width="60%" height={14} />
        <SkeletonBar width="40%" height={10} />
      </div>
      <SkeletonBar width={60} height={24} rounded="full" />
    </div>
  );
}
