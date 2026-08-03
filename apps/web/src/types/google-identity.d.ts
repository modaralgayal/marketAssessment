/** Minimal types for Google Identity Services (GIS) OAuth token client. */

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: TokenClientConfig) => TokenClient;
}

interface GoogleAccounts {
  oauth2: GoogleOAuth2;
}

interface Window {
  google: {
    accounts: GoogleAccounts;
  };
}