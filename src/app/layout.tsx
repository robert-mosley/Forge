import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KSUForge — Find your next teammate",
    template: "%s · KSUForge",
  },
  description:
    "A collaboration platform for KSU students across all majors. Build with people whose skills complement yours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>{children}</body>
    </html>
  );
}
