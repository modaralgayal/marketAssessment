/**
 * Google Identity Services integration for read-only Google Sheets access.
 *
 * Uses the admin's own Google account to get a one-time OAuth token with
 * the spreadsheets.readonly scope. The token is sent to the backend for a
 * single sync call and is never stored.
 *
 * Requires VITE_GOOGLE_OAUTH_CLIENT_ID to be set in the frontend .env.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

let gisLoaded = false;

/** Load the Google Identity Services library dynamically. */
export async function preloadGis(): Promise<void> {
  await loadGis();
}

async function loadGis(): Promise<void> {
  if (gisLoaded) return;
  if (window.google?.accounts?.oauth2) {
    gisLoaded = true;
    return;
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google Identity Services library."));
    document.head.appendChild(script);
  });
}

/**
 * Opens a Google consent popup and returns a one-time access token
 * with read-only Sheets access.
 *
 * @throws If the OAuth client ID is not configured, or the user denies consent.
 */
export async function getSheetsToken(): Promise<string> {
  if (!CLIENT_ID) {
    throw new Error(
      "Google Sheets sync is not configured. Set VITE_GOOGLE_OAUTH_CLIENT_ID in your environment.",
    );
  }

  await loadGis();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken();
  });
}