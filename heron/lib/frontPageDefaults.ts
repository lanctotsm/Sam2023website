export type HeroSettings = {
    title: string;
    subtitle: string;
    backgroundType: "gradient" | "color" | "image";
    backgroundColor: string;
    backgroundImage: string;
    gradientFrom: string;
    gradientTo: string;
};

export type AboutSettings = {
    heading: string;
    paragraphs: string[];
};

export type CardItem = {
    icon: string;
    title: string;
    text: string;
};

export type CardsSettings = {
    heading: string;
    columns: number;
    items: CardItem[];
};

export type JourneySettings = {
    heading: string;
    paragraphs: string[];
};

export type InterestItem = {
    icon: string;
    label: string;
};

export type InterestsSettings = {
    heading: string;
    items: InterestItem[];
};

export type ContactLink = {
    icon: string;
    label: string;
    url: string;
};

export type ContactSettings = {
    heading: string;
    text: string;
    showSocials: boolean;
    links: ContactLink[];
};

export type FrontPageSettings = {
    hero: HeroSettings;
    about: AboutSettings;
    cards: CardsSettings;
    journey: JourneySettings;
    interests: InterestsSettings;
    contact: ContactSettings;
};

export const defaultFrontPage: FrontPageSettings = {
    hero: {
        title: "Samuel Lanctot",
        subtitle:
            "Developer, creator, and lifelong learner passionate about building meaningful experiences through technology and art.",
        backgroundType: "gradient",
        backgroundColor: "#6B2D2D",
        backgroundImage: "",
        gradientFrom: "",
        gradientTo: ""
    },
    about: {
        heading: "About Me",
        paragraphs: [
            "Hello! My name is Sam Lanctot, I'm a software engineer in the DC metro area. Currently I'm employed at GEICO as a Senior Software Engineer working on commercial software dealing with DuckCreek and Next.js based service applications.",
            "I have 7 years experience in full stack .NET development and 2 years experience in Node.js/Python/Scala development. My journey began with a fascination for how things work, which evolved into a passion for building solutions that matter.",
            "My hobbies include photography, Magic the Gathering, Dungeons & Dragons, and video games. I also enjoy traveling especially by train. I live in Silver Spring with my wife Caitlin and our two wonderful cats, Catniss and Byron."
        ]
    },
    cards: {
        heading: "What I Do",
        columns: 2,
        items: [
            {
                icon: "Monitor",
                title: "Software Development",
                text: "Building robust applications with modern technologies. From backend systems to responsive frontends, I enjoy crafting elegant solutions to complex problems."
            },
            {
                icon: "Camera",
                title: "Photography",
                text: "Capturing moments and telling stories through the lens. I'm drawn to landscapes, street photography, and the quiet beauty of everyday life."
            },
            {
                icon: "Palette",
                title: "Creative Projects",
                text: "Exploring the boundaries between art and technology. Whether it's generative art, interactive installations, or digital experiments, I love pushing creative limits."
            },
            {
                icon: "BookOpen",
                title: "Continuous Learning",
                text: "Always expanding my horizons through books, courses, and hands-on experimentation. The tech landscape is ever-evolving, and I aim to evolve with it."
            }
        ]
    },
    journey: {
        heading: "My Journey",
        paragraphs: [
            "My path has been anything but linear—and I wouldn't have it any other way. What started as tinkering with computers in my youth has grown into a fulfilling career building software that people actually use. Along the way, I've had the privilege of working with talented teams, tackling interesting challenges, and continuously refining my craft.",
            "I've learned that the most rewarding work happens at the intersection of passion and purpose. Whether I'm debugging a tricky issue at 2 AM or capturing the perfect golden hour shot, the common thread is the joy of creating something meaningful."
        ]
    },
    interests: {
        heading: "Beyond the Screen",
        items: [
            { icon: "Mountain", label: "Hiking & Nature" },
            { icon: "Coffee", label: "Coffee Culture" },
            { icon: "Music", label: "Music Discovery" },
            { icon: "BookOpen", label: "Science Fiction" },
            { icon: "Gamepad2", label: "Indie Games" },
            { icon: "Plane", label: "Travel" }
        ]
    },
    contact: {
        heading: "Let's Connect",
        text: "I'm always open to interesting conversations, collaboration opportunities, or just saying hello. Whether you have a project in mind, want to discuss photography, or simply want to chat about the latest in tech—feel free to reach out.",
        showSocials: true,
        links: [
            { icon: "Mail", label: "Email", url: "mailto:lanctotsm@gmail.com" },
            { icon: "Github", label: "GitHub", url: "https://github.com/samlanctot" },
            {
                icon: "Briefcase",
                label: "LinkedIn",
                url: "https://www.linkedin.com/in/samuel-lanctot/"
            },
            { icon: "FileText", label: "Resume", url: "/resume" }
        ]
    }
};
