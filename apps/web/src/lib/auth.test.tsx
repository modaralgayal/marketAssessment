import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * Regression test for the intermittent "invalid username or password" bug.
 *
 * Firebase does NOT trim passwords, so any stray leading/trailing whitespace
 * (mobile keyboards, copy-paste, password managers) was being baked into the
 * stored credential at sign-up and then failing a byte-for-byte comparison at
 * sign-in. The fix trims email + password on both create and sign-in inside
 * `auth.tsx`. These tests assert that the *trimmed* values are what actually
 * reach the Firebase SDK — i.e. the same-looking credentials now match.
 */

// Firebase SDK calls are captured so we can inspect the exact arguments the
// app hands to `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`.
const fb = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  sendEmailVerification: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: fb.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: fb.createUserWithEmailAndPassword,
  onAuthStateChanged: fb.onAuthStateChanged,
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  sendEmailVerification: fb.sendEmailVerification,
  sendPasswordResetEmail: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
  verifyBeforeUpdateEmail: vi.fn(),
}));

// `auth.tsx` only needs a non-null `auth`/`googleProvider` here; the real
// objects are replaced so the SDK calls above are the only thing that matters.
const mockFirebase = vi.hoisted(() => ({ auth: {}, googleProvider: {} }));
vi.mock("./firebase", () => ({ auth: mockFirebase.auth, googleProvider: mockFirebase.googleProvider }));

import { AuthProvider, useAuth } from "./auth";

function renderAuth() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  fb.createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "u1" } });
  fb.signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "u1" } });
});

describe("auth: input trimming (invalid-credential regression)", () => {
  it("trims surrounding whitespace from email + password on sign-in", async () => {
    const { result } = renderAuth();

    await act(async () => {
      await result.current.signInWithEmail("  User@Example.com  ", "  secret  ");
    });

    expect(fb.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    const [, email, password] = fb.signInWithEmailAndPassword.mock.calls[0]!;
    expect(email).toBe("User@Example.com"); // Firebase normalizes later; we just strip whitespace
    expect(password).toBe("secret");
    expect(password).not.toContain(" ");
  });

  it("trims surrounding whitespace from email + password on sign-up", async () => {
    const { result } = renderAuth();

    await act(async () => {
      await result.current.signUpWithEmail("\n  buyer@x.co \n", "  pass123  ");
    });

    expect(fb.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    const [, email, password] = fb.createUserWithEmailAndPassword.mock.calls[0]!;
    expect(email).toBe("buyer@x.co");
    expect(password).toBe("pass123");
    // sign-up also fires a (fire-and-forget) verification email for the new user.
    expect(fb.sendEmailVerification).toHaveBeenCalledTimes(1);
  });

  it("passes already-clean credentials through unchanged", async () => {
    const { result } = renderAuth();

    await act(async () => {
      await result.current.signInWithEmail("clean@x.co", "cleanpass");
    });

    const [, email, password] = fb.signInWithEmailAndPassword.mock.calls[0]!;
    expect(email).toBe("clean@x.co");
    expect(password).toBe("cleanpass");
  });
});
