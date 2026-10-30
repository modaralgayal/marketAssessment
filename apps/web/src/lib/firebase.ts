import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Persist the auth session in localStorage so a page refresh restores the signed-in
// user instead of dropping them to /login. Without this the app relies on Firebase's
// implicit default, which can lose the session on refresh in some environments.
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* persistence is best-effort; sign-in still works for the active tab */
});
