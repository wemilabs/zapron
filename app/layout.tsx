import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zapron | Better search for academics",
    template: "%s | Zapron",
  },
  description:
    "Search academic papers across the global research record. Beyond Google Scholar.",
  metadataBase: new URL("https://zapron.vercel.app/"),
  keywords: [
    "zapron",
    "research",
    "ai-tools",
    "search-engine",
    "research",
    "academics",
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
    title: "Zapron | Better search for academics",
    description:
      "Search academic papers across the global research record. Beyond Google Scholar.",
    siteName: "Zapron",
    images: [
      {
        url: "https://ubrw5iu3hw.ufs.sh/f/TFsxjrtdWsEIhIReWYox89qXNTGMOV5WtPpRAJeCFBiQfcLH",
        width: 1200,
        height: 630,
        alt: "Zapron",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zapron | Better search for academics",
    description:
      "Search academic papers across the global research record. Beyond Google Scholar.",
    images: [
      "https://ubrw5iu3hw.ufs.sh/f/TFsxjrtdWsEIhIReWYox89qXNTGMOV5WtPpRAJeCFBiQfcLH",
    ],
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
