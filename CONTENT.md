# CONTENT — verified source copy

Fetched **2026-11-13** from `https://samibyte.vercel.app/` (`/`, `/about`, `/skills`, `/projects`, `/projects/<slug>`, `/contact`).
Transcribe **verbatim**. Do not rewrite, shorten, or "improve" a sentence. Do not add a metric, date, employer or technology that is not in this file.

`[USER: …]` = only the owner can supply it. Omit the field from the data file; never render the placeholder.

---

## Site

| Field | Value |
|---|---|
| Name | Sami Adnan |
| Online handle | samibyte |
| Document title | Sami Adnan \| Full-Stack Web Developer |
| Role line | Full-Stack Web Developer |
| Location | Dhaka, Bangladesh |
| Status | Available for work |
| Email | samibyte.web@gmail.com |
| GitHub | https://github.com/samibyte |
| LinkedIn | https://www.linkedin.com/in/samibyte |
| X | https://x.com/samibyt3 |
| Resume | https://drive.google.com/file/d/1ie1hDAg067E3UA4QIzTW2S5lDkT-kf93/view |
| Site URL | https://samibyte.vercel.app |

Site URL confirmed by the owner **2026-11-15** as the deployed origin. `P7.2` builds `SITE_URL` / `metadataBase` from it; if a custom domain is attached at `P7.3`, change this row and that constant together.

Resume: the live site links a Google Drive file, verified HTTP 200 on **2026-11-15**. It is `resumeUrl`; the owner chose to keep it over a hosted `/resume.pdf` (D-117). Do not generate a fake PDF.

---

## Hero

> I build full-stack applications with modern tools and thoughtful engineering practices, focusing on performance, maintainability, and user experience.

CTAs: **Projects** → `#projects`, **Resume** → `resumeUrl`.

---

## About

Home-page "About Me" (two paragraphs, verbatim):

> My interest in web development began with building user interfaces, but curiosity soon led me to explore what happens behind the scenes. That curiosity evolved into a passion for full-stack development, where I enjoy working across the entire application. From crafting responsive frontend experiences to designing efficient APIs and databases.
>
> I believe good software is more than code; it's about solving real problems with solutions that are performant, maintainable, and enjoyable to use. I'm always learning new technologies, improving my engineering practices, and looking for opportunities to build meaningful products.

About-page opening (the more specific version — prefer this one, it names real things):

> Hi, I'm Sami Adnan, a full-stack developer from Dhaka, Bangladesh. I go by samibyte online.
>
> I started with HTML and CSS out of curiosity, built small things to understand how they worked, and kept going. What I found appealing wasn't just building; it was figuring out why something worked, or didn't.
>
> I work with React, Next.js, TypeScript, and Node.js on the full stack. I care about type safety, schema integrity, and code that's readable six months from now by someone who isn't me.
>
> My approach to engineering is methodical. I gather information before decisions, prefer precision over speed, and invest in understanding systems deeply rather than treating them as black boxes.

---

## Principles (verbatim titles + bodies)

1. **Thoughtful Engineering** — Every technical decision should improve maintainability, reliability, or the overall user experience.
2. **Quality First** — I prioritize clean architecture, testing, and maintainable code over quick fixes that create long-term problems.
3. **User-Centered Development** — Great software should feel intuitive, accessible, and enjoyable for the people who use it every day.
4. **Growth Mindset** — Technology evolves constantly, and I believe continuous learning is essential to building better software.

---

## Journey (newest first)

| Period | Kind | Title | Detail |
|---|---|---|---|
| 2026 – Present | Learning | Next Level Software Engineering | Programming Hero · Advanced Program |
| Dec 2025 – Feb 2026 | Work | Frontend Developer · Softvence Agency | Full-Time · On-site |
| Jul 2025 – Jan 2026 | Learning | Complete Web Development | Programming Hero · Foundation Program |
| 2023 – 2025 | Origin | Self-Directed Study | HTML → CSS → JavaScript → React |

Softvence description (verbatim): *Built and maintained client-facing web applications. Worked on UI components, API integration, and authentication flows. Operated in a structured environment where requirements were defined, deadlines were firm, and code quality was non-negotiable.*

---

## Skills

Grouped exactly as on the live site. Do not add a skill. Do not mark anything "used in projects" unless it appears in a project's stack below.

- **Languages** — TypeScript, JavaScript, Python
- **Frontend** — React, Next.js, Redux Toolkit, Framer Motion, GSAP, Tailwind CSS, Shadcn UI
- **Backend** — Node.js, Express, Socket.io, JWT Auth, Zod
- **Databases & ORMs** — PostgreSQL, MongoDB, MySQL, Prisma ORM, Firebase, Redis
- **Tools & Platforms** — Docker, Git, GitHub Actions, Vercel, Postman, Linux

Resolved by the owner **2026-11-15**: `Three.js` and `GraphQL` removed; every remaining item is defended. Do not re-add a skill that is in no project stack without the owner saying so.

---

## Projects

Five projects. `tag` was the badge shown on the live site's old cards and is not shipped. KeySpace is listed last here but first in `lib/projects.ts` (data file is newest-first).

### 1. StitchLogic — `stitchlogic`

- tag `SYS` · stack `React, Node.js, Express, MongoDB`
- source `https://github.com/samibyte/stitch-logic-client`
- live `https://stitch-logic.web.app/`
- tagline: *A garment manufacturing and production management platform for tracking orders, production stages, and operational workflows.*
- problem: *Garment factories often rely on spreadsheets and manual processes, causing inefficiencies, production delays, and poor visibility into ongoing operations.*
- solution: *Built a centralized system that tracks production progress, manages orders, and provides real-time visibility across manufacturing workflows.*
- challenge: *Designing flexible production pipelines while maintaining accurate status tracking across multiple manufacturing stages.*
- outcome: *Improved production visibility. Reduced manual record keeping. Centralized factory operations.*
- takeaway: *Gained experience designing workflow-driven applications and managing complex business processes.*

### 2. Syncora — `syncora`

- tag `WEB` · stack `Next.js, PostgreSQL, Prisma, Socket.io`
- source `https://github.com/samibyte/syncora`
- live `https://syncora-dusky.vercel.app/`
- tagline: *A collaborative team management and productivity platform with real-time communication and task coordination.*
- problem: *Teams frequently struggle with fragmented communication and disconnected project management tools.*
- solution: *Developed a unified workspace that combines project tracking, team collaboration, and real-time updates.*
- challenge: *Maintaining real-time synchronization between users while ensuring data consistency.*
- outcome: *Improved team coordination. Reduced communication gaps. Enabled real-time project visibility.*
- takeaway: *Deepened understanding of collaborative software architecture and real-time systems.*

### 3. EduAnalytics — `eduanalytics`

- tag `API` · stack `MongoDB, Next.js, TypeScript, Tailwind CSS`
- source `https://github.com/samibyte/learning-analytics-platform`
- live `https://learning-analytics-platform-five.vercel.app/`
- tagline: *An educational analytics platform that provides insights into student performance and institutional outcomes.*
- problem: *Educational institutions often have access to large amounts of student data but lack meaningful insights for decision-making.*
- solution: *Created a data visualization and analytics platform that highlights performance trends and key educational metrics.*
- challenge: *Processing and visualizing large datasets while keeping the interface intuitive for non-technical users.*
- outcome: *Simplified educational reporting. Provided actionable performance insights. Improved data-driven decision making.*
- takeaway: *Learned advanced data visualization techniques and dashboard design principles.*

### 4. Smart Inventory System — `smart-inventory-system`

- tag `APP` · stack `Next.js, PostgreSQL, Prisma`
- source `https://github.com/samibyte/smarty-inventory-system`
- live `https://smarty-inventory-system-one.vercel.app/`
- tagline: *An inventory and stock management solution for businesses to monitor products, suppliers, and stock movement.*
- problem: *Manual inventory tracking leads to stock discrepancies, operational inefficiencies, and poor forecasting.*
- solution: *Built a digital inventory management platform with automated stock tracking and reporting capabilities.*
- challenge: *Ensuring inventory consistency across multiple operations and transactions.*
- outcome: *Reduced stock tracking errors. Improved inventory visibility. Streamlined business operations.*
- takeaway: *Developed expertise in transactional data management and inventory workflows.*

### 5. KeySpace — `keyspace`

Added by the owner **2026-11-15**; not on the 2026-11-13 live-site snapshot. `source` and `live` verified HTTP 200 on **2026-11-15**.

- stack `Next.js, TypeScript, Node.js, PostgreSQL, TanStack Query, Stripe`
- source `https://github.com/samibyte/key-space-client`
- live `https://key-space-byte.vercel.app/`
- tagline: *Find & List Rental Properties with Ease*
- problem: *Rental property hunting and listing is fragmented, making it difficult for tenants and landlords to connect, manage rental requests, and complete payments in one place.*
- solution: *Built a modern, responsive rental property marketplace with dedicated roles for Tenants, Landlords, and Admins. Tenants browse and submit rental requests with Stripe payments; Landlords list properties, manage availability, and approve or reject requests; Admins moderate users and monitor platform statistics.*
- challenge: *Orchestrating a consistent rental state flow from request and approval to payment and activation, while verifying payments on the server with Stripe webhooks to prevent false payment confirmations.*
- outcome: *Secured rental operations with JWT authentication, role-based access control, and ownership checks. Improved responsiveness by caching and synchronizing frequently changing server data with TanStack Query.*
- takeaway: *Strengthened expertise in end-to-end transactional workflow design, Stripe webhook payment verification, and JWT-based role security. Gained practical experience building full-stack role-based marketplaces with real payment integration.*
- role: *Full-Stack Web Developer*
- architecture: *Browser (Next.js App Router) → Server (Node.js/Express) → Database (PostgreSQL via Prisma) → Auth (JWT with HTTP-only cookies)*
- decision — title: *Custom JWT route proxy vs. Next.js middleware*; tradeoff: *Chose edge-friendly proxy.ts for dynamic fallback routing and HTTP-only cookie management over Next.js middleware to maintain full control over token refresh and role checks.*; changed: *Enabled route protection for /dashboard nested paths while preserving anonymous access to public property browsing.*

### Optional per-project fields

`role`, `architecture` (ordered node labels) and `decision` (title / tradeoff / what changed) do **not** exist on the live site for projects 1–4. The owner chose **2026-11-15** to omit them rather than invent them; KeySpace carries the values the owner supplied. When absent the UI renders nothing: no "Coming soon", no empty box.

All four live-site projects say *Project Walkthrough — Coming Soon*. Do not build a video slot.

---

## Contact

Heading: **Get in Touch**
Body (verbatim): *I am currently looking for modern frontend or full stack developer roles. Feel free to reach out to discuss how we can work together.*
Status line: *Available for work · Dhaka, Bangladesh*

Form fields: Name, Email, Message. Submit label: **SEND MESSAGE** — use sentence case ("Send message") for the rebuild; the all-caps treatment belongs to the old terminal theme, which `SPEC.md` §2 excludes.
