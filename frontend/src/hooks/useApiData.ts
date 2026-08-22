import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type UseApiDataResult<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  refetch: () => void;
};

/**
 * Hook générique pour charger des données depuis l'API.
 * Remplace le boilerplate useState/useEffect/apiFetch.
 *
 * @param path - Le chemin API (ex: "/api/favorites")
 * @returns { data, loading, error, refetch }
 */
export function useApiData<T>(path: string): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    apiFetch<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, trigger]);

  const refetch = () => setTrigger((n) => n + 1);

  return { data, loading, error, refetch };
}
