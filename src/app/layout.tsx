import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getBaseUrl } from "@/lib/utils";
import "./globals.css";

function safeMetadataBase(): URL | undefined {
  try {
    return new URL(getBaseUrl());
  } catch {
    return undefined;
  }
}

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: {
    default: "JobPilot — Find jobs. Ace the interview.",
    template: "%s · JobPilot",
  },
  description:
    "JobPilot finds relevant, fresh job listings and prepares you for company-specific interviews and assessments with AI-generated prep reports and mock interviews.",
  keywords: ["job search", "interview prep", "AI mock interview", "assessment prep", "careers"],
  openGraph: {
    title: "JobPilot — Find jobs. Ace the interview.",
    description:
      "Fresh job listings plus AI-powered, company-specific interview prep and mock interviews.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080b14" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
