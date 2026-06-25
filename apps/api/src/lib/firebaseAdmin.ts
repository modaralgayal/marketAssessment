import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
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
