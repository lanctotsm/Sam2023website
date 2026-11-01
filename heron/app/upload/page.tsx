import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/api-utils";
import UploadForm from "./UploadForm";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function UploadPage() {
  const user = await getAuthUser();
  if (!user) {
    notFound();
  }

  return <UploadForm />;
}
