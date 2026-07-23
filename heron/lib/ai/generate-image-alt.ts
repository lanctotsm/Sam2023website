import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

export const NOVA_LITE_MODEL_ID = "amazon.nova-lite-v1:0";

const ALT_SYSTEM_PROMPT =
  "You write short accessibility alt text for photographs. " +
  "Describe what is visible in 1–2 plain sentences. No markdown, no quotes, no preamble.";

const ALT_USER_PROMPT =
  "Write accessibility alt text for this image.";

export type ImageFormat = "jpeg" | "png" | "gif" | "webp";

export type GenerateAltFromBytesParams = {
  bytes: Buffer;
  format: ImageFormat;
  /** Injected for tests */
  invoke?: (body: unknown) => Promise<unknown>;
};

function getEnv(name: string, fallback = "") {
  return process.env[name] || fallback;
}

export function detectImageFormat(contentTypeOrExt: string): ImageFormat {
  const v = contentTypeOrExt.toLowerCase();
  if (v.includes("png") || v.endsWith(".png")) return "png";
  if (v.includes("webp") || v.endsWith(".webp")) return "webp";
  if (v.includes("gif") || v.endsWith(".gif")) return "gif";
  return "jpeg";
}

/** Parse Nova InvokeModel JSON and return the first text content block. */
export function parseNovaAltResponse(modelResponse: unknown): string {
  const root = modelResponse as {
    output?: { message?: { content?: Array<{ text?: string }> } };
  };
  const text = root?.output?.message?.content?.find((c) => typeof c.text === "string")?.text;
  if (!text || !text.trim()) {
    throw new Error("AI returned empty alt text");
  }
  return text.trim().replace(/^["']|["']$/g, "");
}

function buildNovaRequestBody(bytes: Buffer, format: ImageFormat) {
  return {
    schemaVersion: "messages-v1",
    system: [{ text: ALT_SYSTEM_PROMPT }],
    messages: [
      {
        role: "user",
        content: [
          {
            image: {
              format,
              source: {
                bytes: bytes.toString("base64")
              }
            }
          },
          { text: ALT_USER_PROMPT }
        ]
      }
    ],
    inferenceConfig: {
      maxTokens: 200,
      temperature: 0.2,
      topP: 0.9
    }
  };
}

async function defaultInvoke(body: unknown): Promise<unknown> {
  const region = getEnv("S3_REGION") || getEnv("AWS_REGION") || "us-east-1";
  const client = new BedrockRuntimeClient({
    region,
    credentials:
      getEnv("AWS_ACCESS_KEY_ID") && getEnv("AWS_SECRET_ACCESS_KEY")
        ? {
            accessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
            secretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY")
          }
        : undefined
  });
  const response = await client.send(
    new InvokeModelCommand({
      modelId: NOVA_LITE_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: Buffer.from(JSON.stringify(body))
    })
  );
  const raw = response.body;
  if (!raw) {
    throw new Error("Empty AI response body");
  }
  const json = JSON.parse(Buffer.from(raw).toString("utf8"));
  return json;
}

/**
 * Generate accessibility alt text for an image via the configured vision model.
 * Uses AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (deploy maps APP_AWS_* secrets into these).
 * IAM is on the CMS app managed policy (bedrock:InvokeModel for Nova Lite).
 */
export async function generateAltTextFromBytes(
  params: GenerateAltFromBytesParams
): Promise<string> {
  const body = buildNovaRequestBody(params.bytes, params.format);
  const invoke = params.invoke ?? defaultInvoke;
  const modelResponse = await invoke(body);
  return parseNovaAltResponse(modelResponse);
}
