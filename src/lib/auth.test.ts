import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from "./auth";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("auth storage helpers", () => {
  it("returns null when session storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(getStoredAuthSession()).toBeNull();
  });

  it("normalizes legacy snake_case sessions from storage", () => {
    sessionStorage.setItem(
      "inventory-auth-session",
      JSON.stringify({
        token: "inventory-token",
        user: {
          _id: "user-1",
          email_id: "ops@example.com",
          first_name: "Inventory",
          last_name: "Operator",
          user_access: "INVENTORY",
          company_id: "company-1",
        },
      }),
    );

    expect(getStoredAuthSession()).toEqual({
      token: "inventory-token",
      user: {
        _id: "user-1",
        emailId: "ops@example.com",
        firstName: "Inventory",
        lastName: "Operator",
        userAccess: "INVENTORY",
        companyId: "company-1",
      },
    });
  });

  it("swallows session storage write and delete failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });

    expect(() =>
      setStoredAuthSession({
        token: "inventory-token",
        user: {
          _id: "user-1",
          emailId: "ops@example.com",
          firstName: "Inventory",
          lastName: "Operator",
          userAccess: "INVENTORY",
        },
      }),
    ).not.toThrow();

    vi.restoreAllMocks();

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(() => clearStoredAuthSession()).not.toThrow();
  });
});
