/**
 * Hook React pour les feature flags côté client.
 *
 * Utilisation :
 *   const { isEnabled, isLoading } = useFeatureFlag("vehicle-gallery-v2");
 *
 *   if (isEnabled) {
 *     return <NewGallery />;
 *   }
 *   return <OldGallery />;
 */

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

type FeatureFlagResponse = {
  status: "ok";
  data: { key: string; enabled: boolean };
};

type UseFeatureFlagResult = {
  isEnabled: boolean;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Vérifie un feature flag via l'API.
 * Cache le résultat pendant 5 minutes côté client.
 */
export function useFeatureFlag(flagKey: string): UseFeatureFlagResult {
  const query = useQuery({
    queryKey: ["feature-flag", flagKey],
    queryFn: () =>
      apiFetch<FeatureFlagResponse>(`/api/feature-flags/check/${flagKey}`),
    select: (response) => response.data.enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    isEnabled: query.data ?? false,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}

/**
 * Hook pour vérifier plusieurs flags en une fois.
 */
export function useFeatureFlags(
  flagKeys: string[],
): Record<string, boolean> {
  const results = flagKeys.reduce(
    (acc, key) => {
      const { isEnabled } = useFeatureFlag(key);
      acc[key] = isEnabled;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  return results;
}
