import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

/** S3 client for generating presigned URLs. Uses S3_PRESIGN_ENDPOINT_URL when set so the signed URL is browser-accessible (e.g. localhost:9000 instead of minio:9000). */
function getPresignS3Client() {
  const region = getEnv("S3_REGION", "us-east-1");
  const endpoint = getEnv("S3_PRESIGN_ENDPOINT_URL") || getEnv("S3_ENDPOINT_URL");
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

export async function presignPutObject(params: {
  key: string;
  contentType: string;
  size: number;
}) {
  const client = getPresignS3Client();
  const bucket = getEnv("S3_BUCKET");
  if (!bucket) {
    throw new Error("S3_BUCKET is required");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.size
  });

  return getSignedUrl(client, command, { expiresIn: 60 * 10 });
}
