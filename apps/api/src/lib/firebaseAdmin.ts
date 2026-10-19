import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import {
  getAuth,
  type Auth,
  type DecodedIdToken,
  type UserRecord,
} from "firebase-admin/auth";
import { env } from "../env.js";

let app: App | null = null;

function getApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }
  if (!env.FIREBASE_SERVICE_ACCOUNT_B64) {
    throw new Error(
      "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_B64 to a base64-encoded service-account JSON.",
    );
  }
  const json = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8");
  const serviceAccount = JSON.parse(json);
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  return getAuth(getApp()).verifyIdToken(token);
}

/**
 * The Firebase Admin Auth instance. Use this (instead of `getAuth` directly)
 * for user-management operations: deleting users, generating password-reset and
 * email-verification links, and reading provider data.
 */
export function adminAuth(): Auth {
  return getAuth(getApp());
}

/** Fetch a Firebase user by uid. Throws AuthError (user-not-found) if absent. */
export async function getFirebaseUser(uid: string): Promise<UserRecord> {
  return adminAuth().getUser(uid);
}

/**
 * Build a password-reset action link. The link resolves via Firebase's hosted
 * action handler; `continueUrl` is where the user lands afterwards.
 */
export async function generatePasswordResetLink(
  email: string,
  continueUrl: string,
): Promise<string> {
  return adminAuth().generatePasswordResetLink(email, {
    url: continueUrl,
    handleCodeInApp: false,
  });
}

/** Build an email-verification action link (same handler as reset). */
export async function generateEmailVerificationLink(
  email: string,
  continueUrl: string,
): Promise<string> {
  return adminAuth().generateEmailVerificationLink(email, {
    url: continueUrl,
    handleCodeInApp: false,
  });
}

/** Permanently delete a Firebase user (e.g. on self-service account erasure). */
export async function deleteFirebaseUser(uid: string): Promise<void> {
  await adminAuth().deleteUser(uid);
}
