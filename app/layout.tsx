import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chartquery.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ChartQuery",
  description: "Ask plain-language data questions and get trustworthy visual explanations.",
  openGraph: {
    title: "ChartQuery",
    description: "Ask plain-language data questions and get trustworthy visual explanations.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ChartQuery",
    description: "Ask plain-language data questions and get trustworthy visual explanations."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
