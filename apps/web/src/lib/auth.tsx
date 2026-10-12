import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { bootstrapAccount, fetchAccountMe } from "./api";
import type { AccountDto } from "@mea/shared";

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
  bootstrap: (inviteToken?: string) => Promise<AccountDto>;
  logout: () => Promise<void>;
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

  const bootstrap = async (inviteToken?: string) => {
    const created = await bootstrapAccount(inviteToken);
    setAccount(created);
    return created;
  };

  const logout = async () => {
    setAccount(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, account, accountLoading, signIn, signInWithEmail, signUpWithEmail, bootstrap, logout }}
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
