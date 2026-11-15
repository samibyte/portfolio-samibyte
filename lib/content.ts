export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://samibyte.vercel.app"
).replace(/\/+$/, "");

const resumeUrl =
  "https://drive.google.com/file/d/1ie1hDAg067E3UA4QIzTW2S5lDkT-kf93/view";

export const content = {
  name: "Sami Adnan",
  handle: "samibyte",
  title: "Sami Adnan | Full-Stack Web Developer",
  description:
    "I build full-stack applications with modern tools and thoughtful engineering practices, focusing on performance, maintainability, and user experience.",
  role: "Full-Stack Web Developer",
  location: "Dhaka, Bangladesh",
  status: "Available for work",
  email: "samibyte.web@gmail.com",
  resumeUrl,
  links: {
    github: "https://github.com/samibyte",
    linkedin: "https://www.linkedin.com/in/samibyte",
    x: "https://x.com/samibyt3",
  },
  hero: {
    intro:
      "I build full-stack applications with modern tools and thoughtful engineering practices, focusing on performance, maintainability, and user experience.",
    ctas: [
      { label: "Projects", href: "#projects" },
      {
        label: "Resume",
        href: resumeUrl,
      },
    ],
  },
  about: {
    paragraphs: [
      "Hi, I'm Sami Adnan, a full-stack developer from Dhaka, Bangladesh. I go by samibyte online.",
      "I started with HTML and CSS out of curiosity, built small things to understand how they worked, and kept going. What I found appealing wasn't just building; it was figuring out why something worked, or didn't.",
      "I work with React, Next.js, TypeScript, and Node.js on the full stack. I care about type safety, schema integrity, and code that's readable six months from now by someone who isn't me.",
      "My approach to engineering is methodical. I gather information before decisions, prefer precision over speed, and invest in understanding systems deeply rather than treating them as black boxes.",
    ],
  },
  principles: [
    {
      title: "Thoughtful Engineering",
      body: "Every technical decision should improve maintainability, reliability, or the overall user experience.",
    },
    {
      title: "Quality First",
      body: "I prioritize clean architecture, testing, and maintainable code over quick fixes that create long-term problems.",
    },
    {
      title: "User-Centered Development",
      body: "Great software should feel intuitive, accessible, and enjoyable for the people who use it every day.",
    },
    {
      title: "Growth Mindset",
      body: "Technology evolves constantly, and I believe continuous learning is essential to building better software.",
    },
  ],
  journey: [
    {
      period: "2026 – Present",
      kind: "Learning",
      title: "Next Level Software Engineering",
      detail: "Programming Hero · Advanced Program",
    },
    {
      period: "Dec 2025 – Feb 2026",
      kind: "Work",
      title: "Frontend Developer · Softvence Agency",
      detail: "Full-Time · On-site",
      description:
        "Built and maintained client-facing web applications. Worked on UI components, API integration, and authentication flows. Operated in a structured environment where requirements were defined, deadlines were firm, and code quality was non-negotiable.",
    },
    {
      period: "Jul 2025 – Jan 2026",
      kind: "Learning",
      title: "Complete Web Development",
      detail: "Programming Hero · Foundation Program",
    },
    {
      period: "2023 – 2025",
      kind: "Origin",
      title: "Self-Directed Study",
      detail: "HTML → CSS → JavaScript → React",
    },
  ],
  skills: [
    { title: "Languages", items: ["TypeScript", "JavaScript", "Python"] },
    {
      title: "Frontend",
      items: [
        "React",
        "Next.js",
        "Redux Toolkit",
        "Framer Motion",
        "GSAP",
        "Tailwind CSS",
        "Shadcn UI",
      ],
    },
    {
      title: "Backend",
      items: [
        "Node.js",
        "Express",
        "Socket.io",
        "JWT Auth",
        "Zod",
      ],
    },
    {
      title: "Databases & ORMs",
      items: [
        "PostgreSQL",
        "MongoDB",
        "MySQL",
        "Prisma ORM",
        "Firebase",
        "Redis",
      ],
    },
    {
      title: "Tools & Platforms",
      items: [
        "Docker",
        "Git",
        "GitHub Actions",
        "Vercel",
        "Postman",
        "Linux",
      ],
    },
  ],
  contact: {
    heading: "Get in Touch",
    body: "I am currently looking for modern frontend or full stack developer roles. Feel free to reach out to discuss how we can work together.",
    status: "Available for work · Dhaka, Bangladesh",
    form: {
      name: "Name",
      email: "Email",
      message: "Message",
      submit: "Send message",
    },
  },
} as const;
