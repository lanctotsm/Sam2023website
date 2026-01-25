#!/bin/sh

echo "Waiting for MinIO..."
until mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; do
  sleep 1
done

BUCKET="${S3_BUCKET:-cms}"
echo "Ensuring bucket exists: ${BUCKET}"
mc mb -p "local/${BUCKET}" >/dev/null 2>&1 || true

echo "Setting bucket policy (anonymous download)"
mc anonymous set download "local/${BUCKET}" >/dev/null 2>&1 || true

echo "Setting bucket CORS"
mc cors set "local/${BUCKET}" /tmp/minio-cors.xml >/dev/null 2>&1 || true

echo "MinIO ready."
