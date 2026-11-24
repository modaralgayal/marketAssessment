import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Regression test for the raw-Firebase-error-on-signup issue: a duplicate email
 * used to surface Firebase's raw "Firebase: Error (auth/email-already-in-use)."
 * Now Signup maps Firebase auth error codes through `authErrorMessage` so the
 * user sees a friendly message instead.
 */

const fb = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: fb.createUserWithEmailAndPassword,
  onAuthStateChanged: fb.onAuthStateChanged,
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
  verifyBeforeUpdateEmail: vi.fn(),
}));

const mockFirebase = vi.hoisted(() => ({ auth: {}, googleProvider: {} }));
vi.mock("../../lib/firebase", () => ({ auth: mockFirebase.auth, googleProvider: mockFirebase.googleProvider }));

import { AuthProvider } from "../../lib/auth";
import Signup from "./Signup";

function renderSignup() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </AuthProvider>
  );
  return render(<Signup />, { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Signup: duplicate-email error handling", () => {
  it("shows a friendly message for auth/email-already-in-use (not the raw Firebase string)", async () => {
    fb.createUserWithEmailAndPassword.mockRejectedValue(
      Object.assign(new Error("Firebase: Error (auth/email-already-in-use)."), {
        code: "auth/email-already-in-use",
      }),
    );

    renderSignup();

    fireEvent.change(screen.getByPlaceholderText("Work email"), {
      target: { value: "taken@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Create a password"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByLabelText(/accept the/i));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    });

    // Friendly, human-readable — must NOT contain the raw Firebase error string.
    const msg = await screen.findByText(/an account with this email already exists/i);
    expect(msg).toBeTruthy();
    expect(screen.queryByText(/Firebase: Error/i)).toBeNull();
    expect(fb.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
  });

  it("still rejects when passwords don't match", async () => {
    fb.createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "u1" } });

    renderSignup();

    fireEvent.change(screen.getByPlaceholderText("Work email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Create a password"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "different" },
    });
    fireEvent.click(screen.getByLabelText(/accept the/i));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    });

    expect(await screen.findByText(/passwords don't match/i)).toBeTruthy();
    expect(fb.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });
});
