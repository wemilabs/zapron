import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zapron | The research engine for academics",
    template: "%s | Zapron",
  },
  description:
    "Search, explore, and reason over the global research record. Powered by OpenAlex.",
  metadataBase: new URL("https://zapron.vercel.app/"),
  keywords: [
    "zapron",
    "research",
    "ai-tools",
    "search-engine",
    "academics",
    "openalex",
    "lisham_",
  ],
  authors: [
    {
      name: "lisham_",
      url: "https://lisham.dev/",
    },
  ],
  creator: "lisham_",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zapron.vercel.app/",
    title: "Zapron | The research engine for academics",
    description:
      "Search, explore, and reason over the global research record. Powered by OpenAlex.",
    siteName: "Zapron",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Zapron",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zapron | The research engine for academics",
    description:
      "Search, explore, and reason over the global research record. Powered by OpenAlex.",
    images: ["/og.png"],
    creator: "@mthlish",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
