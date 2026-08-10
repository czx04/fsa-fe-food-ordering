import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./AuthContext";
import { AuthenticatedRoute, RoleRoute } from "./route-guards";

vi.mock("./AuthContext", () => ({ useAuth: vi.fn() }));

const owner = {
  _id: "owner-1",
  fullName: "Owner Demo",
  email: "owner@example.com",
  phone: "0900000000",
  role: "restaurant_owner" as const,
  status: "active" as const,
};

const renderProtectedRoute = () => render(
  <MemoryRouter initialEntries={["/owner"]}>
    <Routes>
      <Route element={<AuthenticatedRoute />}>
        <Route element={<RoleRoute role="restaurant_owner" />}>
          <Route path="/owner" element={<h1>Owner console</h1>} />
        </Route>
      </Route>
      <Route path="/login" element={<h1>Login</h1>} />
      <Route path="/forbidden" element={<h1>Forbidden</h1>} />
    </Routes>
  </MemoryRouter>,
);

describe("dashboard route guards", () => {
  beforeEach(() => vi.mocked(useAuth).mockReset());

  it("redirects a guest to login", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false } as ReturnType<typeof useAuth>);
    renderProtectedRoute();
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  it("allows the expected role", () => {
    vi.mocked(useAuth).mockReturnValue({ user: owner, isLoading: false } as ReturnType<typeof useAuth>);
    renderProtectedRoute();
    expect(screen.getByRole("heading", { name: "Owner console" })).toBeInTheDocument();
  });

  it("rejects a different role", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { ...owner, role: "admin" }, isLoading: false } as ReturnType<typeof useAuth>);
    renderProtectedRoute();
    expect(screen.getByRole("heading", { name: "Forbidden" })).toBeInTheDocument();
  });
});
