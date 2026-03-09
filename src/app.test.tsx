import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./app";

describe("app", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vendors: [],
          products: [],
          plans: [],
          skus: [],
          inventoryPools: [],
          reservations: [],
          entitlements: [],
          auditLogs: []
        })
      })
    );
  });

  it("renders the operations dashboard shell", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /inventory overview/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reservations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });
});
