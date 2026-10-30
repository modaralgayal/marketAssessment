import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth";
import { type FirebaseError } from "firebase/app";
import { auth, googleProvider } from "./firebase";
import { bootstrapAccount, fetchAccountMe } from "./api";
import type { AccountDto } from "@mea/shared";

/** Map a Firebase auth error code to a human-readable message. Keeps sign-in /
 *  sign-up feedback clear instead of surfacing raw Firebase strings. */
export function authErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as FirebaseError).code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-email":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password is too weak (use at least 6 characters).";
      case "auth/expired-action-code":
      case "auth/invalid-action-code":
        return "This reset link is invalid or has expired. Please request a new one.";
      default:
        return (err as FirebaseError).message ?? "Something went wrong. Please try again.";
    }
  }
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** The self-service Account (buyer/manufacturer), or null if the user has
   *  signed in but not yet completed invite-based sign-up. */
  account: AccountDto | null;
  /** True while we resolve whether the signed-in user has an Account. */
  accountLoading: boolean;
  signIn: () => Promise<void>;
  /** Sign in with email + password (existing accounts). */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Register a new account with email + password and send a verification email. */
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  /** Complete sign-up: create/fetch the Account from an invite token. */
  bootstrap: (inviteToken?: string, acceptPrivacy?: boolean) => Promise<AccountDto>;
  logout: () => Promise<void>;
  /** Send a Firebase password-reset email (self-service "forgot password"). */
  resetPassword: (email: string) => Promise<void>;
  /** Check a password-reset code from the emailed link is still valid. */
  verifyResetCode: (code: string) => Promise<string>;
  /** Finish a password reset using the code from the emailed link. */
  confirmResetPassword: (code: string, newPassword: string) => Promise<void>;
  /** Re-authenticate the current email/password user (required before sensitive changes). */
  reauthenticate: (password: string) => Promise<void>;
  /** Change the signed-in user's password (re-auth required). */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Change the signed-in user's email (re-auth required; sends verification). */
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountDto | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // Set accountLoading in the SAME update as `user` so there is no render
      // where user is set but accountLoading is still false (which would let
      // RequireRole fall through to `!account → /signup` on a page refresh).
      setAccountLoading(!!u);
    });
  }, []);

  // Resolve the self-service Account whenever the Firebase user changes.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setAccount(null);
      return;
    }
    setAccountLoading(true);
    (async () => {
      try {
        const me = await fetchAccountMe();
        if (!cancelled) setAccount(me);
      } catch {
        if (!cancelled) setAccount(null);
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Fire-and-forget: nudge verification. The account can still be created
    // immediately; the backend no longer blocks on email_verified.
    if (cred.user) {
      try {
        await sendEmailVerification(cred.user);
      } catch {
        /* non-fatal — user can resend later from the dashboard */
      }
    }
  };

  const bootstrap = async (inviteToken?: string, acceptPrivacy?: boolean) => {
    const created = await bootstrapAccount(inviteToken, acceptPrivacy);
    setAccount(created);
    return created;
  };

  const logout = async () => {
    setAccount(null);
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email, {
      // handleCodeInApp:true makes Firebase redirect back to our page WITH the
      // oobCode in the query string, so ResetPassword.tsx can complete it.
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: true,
    });
  };

  const verifyResetCode = async (code: string) => {
    return verifyPasswordResetCode(auth, code);
  };

  const confirmResetPassword = async (code: string, newPassword: string) => {
    await confirmPasswordReset(auth, code, newPassword);
  };

  const reauthenticate = async (password: string) => {
    const u = auth.currentUser;
    if (!u || !u.email) throw new Error("You must be signed in with email and password.");
    const cred = EmailAuthProvider.credential(u.email, password);
    await reauthenticateWithCredential(u, cred);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const u = auth.currentUser;
    if (!u) throw new Error("You must be signed in.");
    await reauthenticate(currentPassword);
    await updatePassword(u, newPassword);
  };

  const changeEmail = async (currentPassword: string, newEmail: string) => {
    const u = auth.currentUser;
    if (!u) throw new Error("You must be signed in.");
    await reauthenticate(currentPassword);
    await verifyBeforeUpdateEmail(u, newEmail);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, account, accountLoading, signIn, signInWithEmail, signUpWithEmail, bootstrap, logout, resetPassword, verifyResetCode, confirmResetPassword, reauthenticate, changePassword, changeEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
