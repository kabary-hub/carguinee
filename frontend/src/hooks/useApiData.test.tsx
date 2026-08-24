import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useApiData } from "./useApiData";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useApiData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne loading=true au démarrage", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      }),
    );

    const { result } = renderHook(() => useApiData<string>("/api/test"), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("retourne les données après chargement", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: "hello" }),
      }),
    );

    const { result } = renderHook(() => useApiData<string>("/api/test"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ data: "hello" });
    expect(result.current.error).toBe("");
  });

  it("retourne une erreur si l'API échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Server error" }),
      }),
    );

    const { result } = renderHook(() => useApiData<string>("/api/error"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it("fournit une fonction refetch", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: `call-${callCount}` }),
        });
      }),
    );

    const { result } = renderHook(() => useApiData<string>("/api/test"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual({ data: "call-2" });
    });
  });
});
