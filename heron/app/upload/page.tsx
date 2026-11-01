import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/api-utils";
import UploadForm from "./UploadForm";

export default async function UploadPage() {
  const user = await getAuthUser();
  if (!user) {
    notFound();
  }

  return <UploadForm />;
}
