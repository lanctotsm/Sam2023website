import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/server";
import UploadForm from "./UploadForm";

export default async function UploadPage() {
  const user = await getServerUser();
  if (!user) {
    notFound();
  }

  return <UploadForm />;
}
