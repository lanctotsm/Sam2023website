import { getSetting } from "@/services/settings";
import { parseFrontPageConfig } from "@/lib/frontPageDefaults";
import FrontPageContent from "@/components/FrontPageContent";
import PageStyleProvider from "@/components/PageStyleProvider";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function HomePage() {
  const raw = await getSetting("front_page");
  const config = parseFrontPageConfig(raw);

  return (
    <PageStyleProvider page="home">
      <FrontPageContent config={config} />
    </PageStyleProvider>
  );
}
