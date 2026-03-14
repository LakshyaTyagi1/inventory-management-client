import { afterEach, describe, expect, it, vi } from "vitest";

describe("api.searchProducts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("maps products from the Peko search API", async () => {
    vi.stubEnv("VITE_SEARCH_API_URL", "https://search.example");
    vi.stubEnv("VITE_SEARCH_API_KEY", "test-api-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        searchType: "fuzzy",
        data: {
          products: [
            {
              product_name: "IPIX CRM",
              weburl: "ipix-crm",
              company: "Example Corp",
              logo_url: "https://storage.googleapis.com/logo.png",
              overview: "CRM for small teams",
              category: [{ name: "CRM Software", weburl: "crm-software" }],
            },
          ],
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();

    const { api } = await import("./api");
    const results = await api.searchProducts("CRM", 10);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://search.example/api/v1/search/CRM?productLimit=10",
      {
        headers: {
          "X-API-Key": "test-api-key",
          accept: "application/json",
        },
      },
    );
    expect(results).toEqual([
      {
        id: "ipix-crm",
        slug: "ipix-crm",
        name: "IPIX CRM",
        vendor: "Example Corp",
        description: "CRM for small teams",
        logoUrl: "https://storage.googleapis.com/logo.png",
      },
    ]);
  });
});
