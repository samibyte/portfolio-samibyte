import type { Project } from "./types";

export const PROJECTS: Project[] = [
  {
    slug: "keyspace",
    title: "KeySpace",
    tag: "APP",
    tagline: "Find & List Rental Properties with Ease",
    stack: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "Prisma",
      "JWT",
      "TanStack Query",
      "Shadcn UI",
      "Stripe",
    ],
    problem:
      "Rental property hunting and listing is fragmented, making it difficult for tenants and landlords to connect, manage rental requests, and complete payments in one place.",
    solution:
      "Built a modern, responsive rental property marketplace with dedicated roles for Tenants, Landlords, and Admins. Tenants browse and submit rental requests with Stripe payments; Landlords list properties, manage availability, and approve or reject requests; Admins moderate users and monitor platform statistics.",
    challenge:
      "Orchestrating a consistent rental state flow from request and approval to payment and activation, while verifying payments on the server with Stripe webhooks to prevent false payment confirmations.",
    outcome:
      "Secured rental operations with JWT authentication, role-based access control, and ownership checks. Improved responsiveness by caching and synchronizing frequently changing server data with TanStack Query.",
    takeaway:
      "Strengthened expertise in end-to-end transactional workflow design, Stripe webhook payment verification, and JWT-based role security. Gained practical experience building full-stack role-based marketplaces with real payment integration.",
    source: "https://github.com/samibyte/key-space-client",
    live: "https://key-space-byte.vercel.app/",
    role: "Full-Stack Web Developer",
    architecture: ["Browser (Next.js App Router)", "Server (Node.js/Express)", "Database (PostgreSQL via Prisma)", "Auth (JWT with HTTP-only cookies)"],
    decision: {
      title: "Custom JWT route proxy vs. Next.js middleware",
      tradeoff: "Chose edge-friendly proxy.ts for dynamic fallback routing and HTTP-only cookie management over Next.js middleware to maintain full control over token refresh and role checks.",
      changed: "Enabled route protection for /dashboard nested paths while preserving anonymous access to public property browsing.",
    },
  },
  {
    slug: "stitchlogic",
    title: "StitchLogic",
    tag: "SYS",
    tagline:
      "A garment manufacturing and production management platform for tracking orders, production stages, and operational workflows.",
    stack: ["React", "Node.js", "Express", "MongoDB"],
    source: "https://github.com/samibyte/stitch-logic-client",
    live: "https://stitch-logic.web.app/",
    problem:
      "Garment factories often rely on spreadsheets and manual processes, causing inefficiencies, production delays, and poor visibility into ongoing operations.",
    solution:
      "Built a centralized system that tracks production progress, manages orders, and provides real-time visibility across manufacturing workflows.",
    challenge:
      "Designing flexible production pipelines while maintaining accurate status tracking across multiple manufacturing stages.",
    outcome:
      "Improved production visibility. Reduced manual record keeping. Centralized factory operations.",
    takeaway:
      "Gained experience designing workflow-driven applications and managing complex business processes.",
  },
  {
    slug: "syncora",
    title: "Syncora",
    tag: "WEB",
    tagline:
      "A collaborative team management and productivity platform with real-time communication and task coordination.",
    stack: ["Next.js", "PostgreSQL", "Prisma", "Socket.io"],
    source: "https://github.com/samibyte/syncora",
    live: "https://syncora-dusky.vercel.app/",
    problem:
      "Teams frequently struggle with fragmented communication and disconnected project management tools.",
    solution:
      "Developed a unified workspace that combines project tracking, team collaboration, and real-time updates.",
    challenge:
      "Maintaining real-time synchronization between users while ensuring data consistency.",
    outcome:
      "Improved team coordination. Reduced communication gaps. Enabled real-time project visibility.",
    takeaway:
      "Deepened understanding of collaborative software architecture and real-time systems.",
  },
  {
    slug: "eduanalytics",
    title: "EduAnalytics",
    tag: "API",
    tagline:
      "An educational analytics platform that provides insights into student performance and institutional outcomes.",
    stack: ["MongoDB", "Next.js", "TypeScript", "Tailwind CSS"],
    source: "https://github.com/samibyte/learning-analytics-platform",
    live: "https://learning-analytics-platform-five.vercel.app/",
    problem:
      "Educational institutions often have access to large amounts of student data but lack meaningful insights for decision-making.",
    solution:
      "Created a data visualization and analytics platform that highlights performance trends and key educational metrics.",
    challenge:
      "Processing and visualizing large datasets while keeping the interface intuitive for non-technical users.",
    outcome:
      "Simplified educational reporting. Provided actionable performance insights. Improved data-driven decision making.",
    takeaway:
      "Learned advanced data visualization techniques and dashboard design principles.",
  },
  {
    slug: "smart-inventory-system",
    title: "Smart Inventory System",
    tag: "APP",
    tagline:
      "An inventory and stock management solution for businesses to monitor products, suppliers, and stock movement.",
    stack: ["Next.js", "PostgreSQL", "Prisma"],
    source: "https://github.com/samibyte/smarty-inventory-system",
    live: "https://smarty-inventory-system-one.vercel.app/",
    problem:
      "Manual inventory tracking leads to stock discrepancies, operational inefficiencies, and poor forecasting.",
    solution:
      "Built a digital inventory management platform with automated stock tracking and reporting capabilities.",
    challenge:
      "Ensuring inventory consistency across multiple operations and transactions.",
    outcome:
      "Reduced stock tracking errors. Improved inventory visibility. Streamlined business operations.",
    takeaway:
      "Developed expertise in transactional data management and inventory workflows.",
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
