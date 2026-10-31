import type { FrontPageSettings } from "@/lib/frontPage";

/**
 * Frozen copy of the homepage that shipped before templates.
 * The untouched-site migration compares stored `front_page` to this value.
 *
 * Do not build this from `createDefaultFrontPageConfig()`. That function now
 * returns Journal. Pointing this constant at the new default would make an
 * untouched seed stop matching, and the migration would skip it.
 */
function legacySeedFrontPage(): FrontPageSettings {
    const sections: FrontPageSettings["sections"] = [
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a01",
            templateId: "banner",
            label: "Top banner",
            data: {
                title: "Samuel Lanctot",
                subtitle:
                    "Developer, creator, and lifelong learner passionate about building meaningful experiences through technology and art.",
                backgroundType: "gradient",
                backgroundColor: "#6B2D2D",
                backgroundImage: "",
                gradientFrom: "",
                gradientTo: "",
                variant: "panel",
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a02",
            templateId: "text-block",
            label: "About",
            data: {
                heading: "About Me",
                paragraphs: [
                    "Hello! My name is Sam Lanctot, I'm a software engineer in the DC metro area. Currently I'm employed at GEICO as a Senior Software Engineer working on commercial software dealing with DuckCreek and Next.js based service applications.",
                    "I have 7 years experience in full stack .NET development and 2 years experience in Node.js/Python/Scala development. My journey began with a fascination for how things work, which evolved into a passion for building solutions that matter.",
                    "My hobbies include photography, Magic the Gathering, Dungeons & Dragons, and video games. I also enjoy traveling especially by train. I live in Silver Spring with my wife Caitlin and our two wonderful cats, Catniss and Byron.",
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a03",
            templateId: "card-grid",
            label: "What I do",
            data: {
                heading: "What I Do",
                columns: 2,
                items: [
                    {
                        icon: "Monitor",
                        title: "Software Development",
                        text: "Building robust applications with modern technologies. From backend systems to responsive frontends, I enjoy crafting elegant solutions to complex problems.",
                    },
                    {
                        icon: "Camera",
                        title: "Photography",
                        text: "Capturing moments and telling stories through the lens. I'm drawn to landscapes, street photography, and the quiet beauty of everyday life.",
                    },
                    {
                        icon: "Palette",
                        title: "Creative Projects",
                        text: "Exploring the boundaries between art and technology. Whether it's generative art, interactive installations, or digital experiments, I love pushing creative limits.",
                    },
                    {
                        icon: "BookOpen",
                        title: "Continuous Learning",
                        text: "Always expanding my horizons through books, courses, and hands-on experimentation. The tech landscape is ever-evolving, and I aim to evolve with it.",
                    },
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a04",
            templateId: "text-block",
            label: "Journey",
            data: {
                heading: "My Journey",
                paragraphs: [
                    "My path has been anything but linear—and I wouldn't have it any other way. What started as tinkering with computers in my youth has grown into a fulfilling career building software that people actually use. Along the way, I've had the privilege of working with talented teams, tackling interesting challenges, and continuously refining my craft.",
                    "I've learned that the most rewarding work happens at the intersection of passion and purpose. Whether I'm debugging a tricky issue at 2 AM or capturing the perfect golden hour shot, the common thread is the joy of creating something meaningful.",
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a05",
            templateId: "tag-list",
            label: "Interests",
            data: {
                heading: "Beyond the Screen",
                items: [
                    { icon: "Mountain", label: "Hiking & Nature" },
                    { icon: "Coffee", label: "Coffee Culture" },
                    { icon: "Music", label: "Music Discovery" },
                    { icon: "BookOpen", label: "Science Fiction" },
                    { icon: "Gamepad2", label: "Indie Games" },
                    { icon: "Plane", label: "Travel" },
                ],
            },
        },
        {
            id: "8f3e2c1a-4b5d-4e7f-8a9b-0c1d2e3f4a06",
            templateId: "contact",
            label: "Contact",
            data: {
                heading: "Let's Connect",
                text: "I'm always open to interesting conversations, collaboration opportunities, or just saying hello. Whether you have a project in mind, want to discuss photography, or simply want to chat about the latest in tech—feel free to reach out.",
                showSocials: true,
                links: [
                    { icon: "Mail", label: "Email", url: "mailto:lanctotsm@gmail.com" },
                    { icon: "Github", label: "GitHub", url: "https://github.com/samlanctot" },
                    {
                        icon: "Briefcase",
                        label: "LinkedIn",
                        url: "https://www.linkedin.com/in/samuel-lanctot/",
                    },
                    { icon: "FileText", label: "Resume", url: "/resume" },
                ],
            },
        },
    ];
    return { sections, sectionOrder: sections.map((section) => section.id) };
}

export const legacyBuiltInFrontPage: FrontPageSettings = legacySeedFrontPage();
