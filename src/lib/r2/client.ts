import { AwsClient } from "aws4fetch";

export type R2Credentials = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

type R2Env = {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
};

export function getR2S3Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function createR2S3Client(creds: R2Credentials): AwsClient {
  return new AwsClient({
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

/** Prefer the Workers R2 binding in production; S3 API is for presigned browser uploads. */
export function requireR2CredentialsFromEnv(
  env: R2Env | NodeJS.ProcessEnv = process.env,
): R2Credentials {
  const source = env as R2Env;
  const accountId = source.R2_ACCOUNT_ID;
  const accessKeyId = source.R2_ACCESS_KEY_ID;
  const secretAccessKey = source.R2_SECRET_ACCESS_KEY;
  const bucketName = source.R2_BUCKET_NAME ?? "petunia-gift-media";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY for presigned URLs",
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

export async function putObjectViaBinding(
  bucket: R2Bucket,
  key: string,
  body: ReadableStream | ArrayBuffer | string | Blob,
  httpMetadata?: R2HTTPMetadata,
): Promise<void> {
  await bucket.put(key, body, { httpMetadata });
}

export async function getObjectViaBinding(
  bucket: R2Bucket,
  key: string,
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

export async function deleteObjectViaBinding(
  bucket: R2Bucket,
  key: string,
): Promise<void> {
  await bucket.delete(key);
}
