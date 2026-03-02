import { getSetting } from "@/services/settings";
import { defaultFrontPage, type FrontPageSettings } from "@/lib/frontPageDefaults";
import FrontPageContent from "@/components/FrontPageContent";

export default async function HomePage() {
  const raw = await getSetting("front_page");
  let config: FrontPageSettings = defaultFrontPage;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      config = {
        hero: { ...defaultFrontPage.hero, ...parsed.hero },
        about: { ...defaultFrontPage.about, ...parsed.about },
        cards: { ...defaultFrontPage.cards, ...parsed.cards },
        journey: { ...defaultFrontPage.journey, ...parsed.journey },
        interests: { ...defaultFrontPage.interests, ...parsed.interests },
        contact: { ...defaultFrontPage.contact, ...parsed.contact }
      };
    } catch {
      // Invalid JSON — use defaults
    }
  }

  return <FrontPageContent config={config} />;
}
