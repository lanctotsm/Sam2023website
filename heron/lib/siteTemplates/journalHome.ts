import type { FrontPageSettings } from "@/lib/frontPage";

/** Journal homepage. Also the built-in default returned by `createDefaultFrontPageConfig`. */
export function journalFrontPage(): FrontPageSettings {
    const sections: FrontPageSettings["sections"] = [
        {
            id: "jrn-banner",
            templateId: "banner",
            label: "Top banner",
            data: {
                title: "Samuel Lanctot",
                subtitle: "Photographs, notes, and the work in between.",
                backgroundType: "gradient",
                backgroundColor: "",
                backgroundImage: "",
                gradientFrom: "",
                gradientTo: "",
                variant: "canvas",
            },
        },
        {
            id: "jrn-about",
            templateId: "text-block",
            label: "About",
            data: {
                heading: "About",
                paragraphs: [
                    "I'm Sam Lanctot, a software engineer in Silver Spring. I take pictures, write notes, and build software.",
                ],
            },
        },
        {
            id: "jrn-recent",
            templateId: "recent-work",
            label: "Recent work",
            data: {
                heading: "Recent work",
                albumLimit: 3,
                postLimit: 3,
                showAlbums: true,
                showPosts: true,
            },
        },
        {
            id: "jrn-contact",
            templateId: "contact",
            label: "Contact",
            data: {
                heading: "Let's Connect",
                text: "I'm always open to interesting conversations, collaboration opportunities, or just saying hello.",
                showSocials: true,
                links: [
                    { icon: "Mail", label: "Email", url: "mailto:lanctotsm@gmail.com" },
                    { icon: "Github", label: "GitHub", url: "https://github.com/samlanctot" },
                    { icon: "Linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/samuel-lanctot/" },
                    { icon: "FileText", label: "Resume", url: "/resume" },
                ],
            },
        },
    ];
    return { sections, sectionOrder: sections.map((section) => section.id) };
}
