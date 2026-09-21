import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

/**
 * Page-level authorization test for admin routes.
 *
 * We do NOT stub `ProtectedRoute` itself, nor do we bypass its `/api/admin/me`
 * check. We only mock the two boundaries it depends on:
 *   - `lib/auth`'s `useAuth()`  -> who the current user is (or null)
 *   - the global `fetch`        -> the `/api/admin/me` admin-status response
 * so the real redirect/render logic is exercised end-to-end and can be
 * asserted to actually block unauthorized access.
 */

const harness = vi.hoisted(() => ({
  authState: {
    user: null as null | { getIdToken: () => Promise<string> },
    loading: false,
  },
}));

vi.mock("../../lib/auth", () => ({
  useAuth: () => harness.authState,
}));

function renderAdminRoute(children: ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={<ProtectedRoute>{children}</ProtectedRoute>}
        />
        <Route path="/admin/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function stubAdminMe(ok: boolean) {
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch = vi
    .fn()
    .mockResolvedValue({ ok, status: ok ? 200 : 403 });
}

beforeEach(() => {
  harness.authState = { user: null, loading: false };
  vi.clearAllMocks();
  delete (globalThis as unknown as { fetch?: ReturnType<typeof vi.fn> }).fetch;
});

describe("ProtectedRoute", () => {
  it("redirects an unauthenticated visitor to /admin/login and never calls /api/admin/me", async () => {
    renderAdminRoute(<div>ADMIN CONTENT</div>);

    // An anonymous user must not even trigger the admin-status fetch.
    expect(
      (globalThis as unknown as { fetch?: ReturnType<typeof vi.fn> }).fetch,
    ).toBeUndefined();

    expect(await screen.findByText("LOGIN PAGE")).toBeTruthy();
    expect(screen.queryByText("ADMIN CONTENT")).toBeNull();
  });

  it("redirects an authenticated non-admin user to /admin/login after the admin check", async () => {
    harness.authState.user = { getIdToken: vi.fn<() => Promise<string>>().mockResolvedValue("tok") };
    stubAdminMe(false); // /api/admin/me returns 403

    renderAdminRoute(<div>ADMIN CONTENT</div>);

    expect(await screen.findByText("LOGIN PAGE")).toBeTruthy();
    expect(screen.queryByText("ADMIN CONTENT")).toBeNull();
  });

  it("renders admin content for an authenticated admin user", async () => {
    harness.authState.user = { getIdToken: vi.fn<() => Promise<string>>().mockResolvedValue("tok") };
    stubAdminMe(true); // /api/admin/me returns 200

    renderAdminRoute(<div>ADMIN CONTENT</div>);

    expect(await screen.findByText("ADMIN CONTENT")).toBeTruthy();
    expect(screen.queryByText("LOGIN PAGE")).toBeNull();
  });

  it("shows the loading state while the admin check is in flight", () => {
    harness.authState.user = { getIdToken: vi.fn<() => Promise<string>>().mockResolvedValue("tok") };
    // fetch never settles, so the gate stays in its "checking" state.
    (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch = vi.fn(
      () => new Promise<never>(() => {}),
    );

    renderAdminRoute(<div>ADMIN CONTENT</div>);

    expect(screen.getByText(/Loading/)).toBeTruthy();
    expect(screen.queryByText("ADMIN CONTENT")).toBeNull();
  });
});
