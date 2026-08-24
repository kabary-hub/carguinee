import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getStoredToken,
  storeToken,
  clearStoredToken,
  resolvePhotoUrl,
  apiFetch,
} from "./api";

// ── Token storage ────────────────────────────────────────────────────────────

describe("Token storage (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("retourne null quand aucun token n'est stocké", () => {
    expect(getStoredToken()).toBeNull();
  });

  it("stocke et lit un token", () => {
    storeToken("test-jwt-token-abc123");
    expect(getStoredToken()).toBe("test-jwt-token-abc123");
  });

  it("écrase un token existant", () => {
    storeToken("token-1");
    storeToken("token-2");
    expect(getStoredToken()).toBe("token-2");
  });

  it("supprime le token", () => {
    storeToken("to-delete");
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });

  it("clearStoredToken ne lance pas d'erreur si aucun token", () => {
    expect(() => clearStoredToken()).not.toThrow();
  });
});

// ── resolvePhotoUrl ──────────────────────────────────────────────────────────

describe("resolvePhotoUrl", () => {
  it("préfixe les URLs /uploads/ avec l'API_URL", () => {
    const result = resolvePhotoUrl("/uploads/vehicles/photo.jpg");
    expect(result).toBe("http://localhost:3000/uploads/vehicles/photo.jpg");
  });

  it("laisse les URLs /demo-vehicles/ intactes", () => {
    const result = resolvePhotoUrl("/demo-vehicles/toyota.jpg");
    expect(result).toBe("/demo-vehicles/toyota.jpg");
  });

  it("laisse les URLs externes intactes", () => {
    const result = resolvePhotoUrl("https://example.com/photo.jpg");
    expect(result).toBe("https://example.com/photo.jpg");
  });

  it("laisse les URLs data: intactes", () => {
    const result = resolvePhotoUrl("data:image/png;base64,abc123");
    expect(result).toBe("data:image/png;base64,abc123");
  });

  it("gère les chemins /uploads/ courts", () => {
    const result = resolvePhotoUrl("/uploads/test.png");
    expect(result).toBe("http://localhost:3000/uploads/test.png");
  });
});

// ── apiFetch ─────────────────────────────────────────────────────────────────

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("envoie une requête GET avec Content-Type JSON", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok", data: { hello: "world" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await apiFetch<{ status: string; data: { hello: string } }>(
      "/api/test",
    );

    expect(result.data.hello).toBe("world");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get("Content-Type")).toBe("application/json");
    expect(options.credentials).toBe("include");
  });

  it("ajoute le header Authorization si un token existe", async () => {
    storeToken("my-jwt-token");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get("Authorization")).toBe("Bearer my-jwt-token");
  });

  it("n'ajoute pas de header Authorization sans token", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get("Authorization")).toBeNull();
  });

  it("lance une erreur avec status pour les réponses non-OK", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({ message: "Resource not found" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/missing")).rejects.toThrow(
      "Resource not found",
    );
  });

  it("lance une erreur générique si pas de message", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve(null),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiFetch("/api/error")).rejects.toThrow(
      "Une erreur est survenue.",
    );
  });

  it("inclut le status code dans l'erreur", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: "Forbidden" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    try {
      await apiFetch("/api/forbidden");
      expect.fail("Should have thrown");
    } catch (err) {
      expect((err as { status: number }).status).toBe(403);
    }
  });

  it("transmet les options personnalisées (method, body)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/create", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe('{"name":"test"}');
  });

  it("construit l'URL complète avec API_URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/users/123");

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:3000/api/users/123");
  });
});
