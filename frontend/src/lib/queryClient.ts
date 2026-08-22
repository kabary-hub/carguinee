import { QueryClient } from "@tanstack/react-query";

/**
 * Client React Query partagé.
 * - staleTime: 30s — les données restent "fraîches" 30s après le fetch
 * - retry: 1 — 1 retry en cas d'échec réseau
 * - refetchOnWindowFocus: false — pas de re-fetch automatique au focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
