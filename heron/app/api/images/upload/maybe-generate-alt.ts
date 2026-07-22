import { getSetting } from "@/services/settings";
import {
  detectImageFormat,
  generateAltTextFromBytes
} from "@/lib/ai/generate-image-alt";

/** Fill empty alt via Bedrock when setting is on; never fail the upload. */
export async function maybeGenerateAltText(
  providedAlt: string,
  imageBytes: Buffer,
  contentType: string
): Promise<string> {
  if (providedAlt) {
    return providedAlt;
  }
  try {
    const enabled = (await getSetting("ai_alt_text_enabled")) === "true";
    if (!enabled) {
      return "";
    }
    const format = detectImageFormat(contentType);
    return await generateAltTextFromBytes({ bytes: imageBytes, format });
  } catch (err) {
    console.error(
      "[upload] AI alt text failed (continuing without):",
      err instanceof Error ? err.message : err
    );
    return "";
  }
}
