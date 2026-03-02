import { getSetting } from "@/services/settings";
import { parseFrontPageConfig } from "@/lib/frontPageDefaults";
import FrontPageContent from "@/components/FrontPageContent";

export default async function HomePage() {
  const raw = await getSetting("front_page");
  const config = parseFrontPageConfig(raw);

  return <FrontPageContent config={config} />;
}
