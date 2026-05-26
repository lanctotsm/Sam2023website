"use client";

import type { FrontPageSettings } from "@/lib/frontPageDefaults";
import { findSection } from "@/lib/frontPageDefaults";
import { HomeSectionView } from "@/components/home/sectionRegistry";

type Props = {
    config: FrontPageSettings;
};

export default function FrontPageContent({ config }: Props) {
    return (
        <div className="flex flex-col gap-8">
            {config.sectionOrder.map((id) => {
                const section = findSection(config, id);
                if (!section) return null;
                return (
                    <div key={section.id}>
                        <HomeSectionView section={section} />
                    </div>
                );
            })}
        </div>
    );
}
