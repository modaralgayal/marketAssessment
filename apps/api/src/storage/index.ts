/**
 * Storage abstraction. The rest of the app depends only on this interface,
 * so swapping R2 for S3, local disk, or Postgres BYTEA later is a one-file change.
 */
export interface StorageProvider {
  /** Store an object and return nothing; key is chosen by the caller. */
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Return a short-lived URL the browser can use to download the object. */
  getSignedUrl(key: string, expiresInSec: number): Promise<string>;
  /** Remove an object. */
  delete(key: string): Promise<void>;
}

import { r2Storage } from "./r2.js";

/** The active provider for the app. Swap this line to change backends. */
export const storage: StorageProvider = r2Storage;
