import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Dock } from "@/components/ui/Dock";
import { OceanProvider } from "@/components/ocean/OceanProvider";
import { content, SITE_URL } from "@/lib/content";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: content.title,
  description: content.description,
  openGraph: {
    title: content.title,
    description: content.description,
    siteName: content.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#80b8e0",
  colorScheme: "dark",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: content.name,
  jobTitle: content.role,
  url: SITE_URL,
  sameAs: [content.links.github, content.links.linkedin, content.links.x],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <OceanProvider />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-16 md:focus:left-20 focus:z-50 focus:rounded focus:bg-[var(--bg-top)] focus:px-4 focus:py-2 focus:text-[var(--text)]"
        >
          Skip to content
        </a>
        <Dock />
        <main
          id="main-content"
          tabIndex={-1}
          className="z-1 flex flex-1 flex-col"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
