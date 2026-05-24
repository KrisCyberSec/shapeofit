import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chartquery.netlify.app"),
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
