import { getSetting } from "@/services/settings";
import { parseFrontPageConfig } from "@/lib/frontPageDefaults";
import FrontPageContent from "@/components/FrontPageContent";
import PageStyleProvider from "@/components/PageStyleProvider";

export default async function HomePage() {
  const raw = await getSetting("front_page");
  const config = parseFrontPageConfig(raw);

  return (
    <PageStyleProvider page="home">
      <FrontPageContent config={config} />
    </PageStyleProvider>
  );
}
