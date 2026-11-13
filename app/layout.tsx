import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Nav } from "@/components/ui/Nav";
import { OceanProvider } from "@/components/ocean/OceanProvider";
import { content } from "@/lib/content";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
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
  themeColor: "#87CEEB",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <OceanProvider />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[var(--bg-top)] focus:px-4 focus:py-2 focus:text-[var(--text)]"
        >
          Skip to content
        </a>
        {/* Chrome slots: DiveLine (P5.4), EffectsToggle (P6.3). */}
        <Nav />
        <div id="diveline-slot" />
        <div id="effects-toggle-slot" />
        <main id="main-content" className="z-1 flex flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
