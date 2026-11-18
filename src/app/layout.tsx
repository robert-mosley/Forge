import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Forge — Find your next teammate",
    template: "%s · Forge",
  },
  description:
    "A collaboration platform for KSU computer science and engineering students. Build with people whose skills complement yours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
