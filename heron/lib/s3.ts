import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";

function getEnv(name: string, fallback = "") {
  return process.env[name] || fallback;
}

export function getS3Client() {
  const region = getEnv("S3_REGION", "us-east-1");
  const endpoint = getEnv("S3_ENDPOINT_URL");
  const forcePathStyle = getEnv("S3_FORCE_PATH_STYLE", "false") === "true";

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle,
    credentials:
      getEnv("AWS_ACCESS_KEY_ID") && getEnv("AWS_SECRET_ACCESS_KEY")
        ? {
            accessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
            secretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY")
          }
        : undefined
  });
}

function getBucket(): string {
  const bucket = getEnv("S3_BUCKET");
  if (!bucket) {
    throw new Error("S3_BUCKET is required");
  }
  return bucket;
}

/** Upload a buffer or Uint8Array to S3 (server-side). */
export async function putObject(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType
    })
  );
}

/** Get object body as Buffer. Throws if not found. */
export async function getObject(key: string): Promise<Buffer> {
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key
    })
  );
  const body = response.Body;
  if (!body) {
    throw new Error("Empty response from S3");
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Delete a single object from S3. Ignores 404. */
export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: key
      })
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "name" in err && err.name === "NoSuchKey") {
      return;
    }
    throw err;
  }
}

/** Delete up to 1000 keys in one request. Ignores 404 for individual keys. */
export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const client = getS3Client();
  const bucket = getBucket();
  const batch = keys.slice(0, 1000);
  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: batch.map((Key) => ({ Key })),
        Quiet: true
      }
    })
  );
  if (keys.length > 1000) {
    await deleteObjects(keys.slice(1000));
  }
}

export type ListedObject = { key: string; lastModified?: Date };

export type ListObjectsResult = {
  objects: ListedObject[];
  nextContinuationToken?: string;
};

/** List object keys under a prefix (paginated). Includes LastModified for stale filtering. */
export async function listObjects(params: {
  prefix: string;
  continuationToken?: string;
  maxKeys?: number;
}): Promise<ListObjectsResult> {
  const client = getS3Client();
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: getBucket(),
      Prefix: params.prefix,
      ContinuationToken: params.continuationToken,
      MaxKeys: params.maxKeys ?? 1000
    })
  );
  const objects: ListedObject[] =
    response.Contents?.map((o) => ({
      key: o.Key!,
      lastModified: o.LastModified
    })).filter((o) => o.key) ?? [];
  return {
    objects,
    nextContinuationToken: response.NextContinuationToken
  };
}
