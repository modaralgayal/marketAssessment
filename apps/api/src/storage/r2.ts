import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env.js";
import type { StorageProvider } from "./index.js";

let client: S3Client | null = null;
let bucket: string | null = null;

function getClient(): { client: S3Client; bucket: string } {
  if (client && bucket) return { client, bucket };

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT } = env;
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || (!R2_ENDPOINT && !R2_ACCOUNT_ID)) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_ENDPOINT (or R2_ACCOUNT_ID).",
    );
  }

  const endpoint = R2_ENDPOINT ?? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  bucket = R2_BUCKET;
  return { client, bucket };
}

export const r2Storage: StorageProvider = {
  async put(key, body, contentType) {
    const { client, bucket } = getClient();
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
  },

  async getSignedUrl(key, expiresInSec) {
    const { client, bucket } = getClient();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: expiresInSec,
    });
  },

  async delete(key) {
    const { client, bucket } = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};
