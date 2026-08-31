import { fetchFeedItems } from "@/lib/feeds/fetchFeed";
import type { RssFeedSectionData } from "@/lib/postsPage";
import FeedStreamSection from "./FeedStreamSection";

type Props = {
    data: RssFeedSectionData;
};

export default async function RssFeedSectionView({ data }: Props) {
    const title = data.title?.trim() || "Feed";
    const feedUrl = data.feedUrl?.trim();

    if (!feedUrl) {
        return null;
    }

    const result = await fetchFeedItems({ title, feedUrl });

    if (result.status === "error") {
        return <FeedStreamSection title={title} items={[]} error={result.message} />;
    }

    return <FeedStreamSection title={title} items={result.items} />;
}
