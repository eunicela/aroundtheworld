import type { Metadata } from "next";
import "@fontsource/zalando-sans/400.css";
import "@fontsource/zalando-sans/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photos Around the World — Street photography, city by city",
  description:
    "Street photography from cities around the world. Spin the globe, pick a city, spend time with strangers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-paper text-charcoal">{children}</body>
    </html>
  );
}
