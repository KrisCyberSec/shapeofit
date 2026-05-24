import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChartQuery",
  description: "Ask anything and see the data visually."
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
