import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

type UseApiDataResult<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  refetch: () => void;
};

/**
 * Hook générique pour charger des données depuis l'API.
 * Utilise React Query en interne pour gérer le cache et les re-fetch.
 *
 * @param path - Le chemin API (ex: "/api/favorites")
 * @returns { data, loading, error, refetch }
 */
export function useApiData<T>(path: string): UseApiDataResult<T> {
  const query = useQuery({
    queryKey: ["api", path],
    queryFn: () => apiFetch<T>(path),
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : "",
    refetch: () => void query.refetch(),
  };
}
