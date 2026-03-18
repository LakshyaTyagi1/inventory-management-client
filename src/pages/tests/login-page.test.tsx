import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/components/auth/auth-provider";
import { api } from "@/lib/api";

import { LoginPage } from "../login-page";

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    login: vi.fn(),
  },
}));

function LocationDisplay() {
  const location = useLocation();

  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isInitializing: false,
      session: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it("restores the full redirect target after sign in", async () => {
    const loginSpy = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      isInitializing: false,
      session: null,
      login: loginSpy,
      logout: vi.fn(),
    });
    vi.mocked(api.login).mockResolvedValue({
      token: "inventory-token",
      user: {
        _id: "user-1",
        emailId: "ops@example.com",
        firstName: "Inventory",
        lastName: "Operator",
        userAccess: "INVENTORY",
      },
    });

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/login",
            state: {
              from: {
                pathname: "/view",
                search: "?filter=crm",
                hash: "#watch-list",
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/view" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ops@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Inventory123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText("/view?filter=crm#watch-list")).toBeInTheDocument();
    });

    expect(api.login).toHaveBeenCalledWith({
      email: "ops@example.com",
      password: "Inventory123!",
    });
    expect(loginSpy).toHaveBeenCalledWith(
      expect.objectContaining({ token: "inventory-token" }),
    );
  });
});
