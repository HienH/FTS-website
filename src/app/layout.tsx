import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FtsProvider } from "@/components/fts-provider";
import { Nav, Footer } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FTS — Football Transfer Simulator",
  description:
    "Pick a real club, build a fantasy transfer window with real market values and wages, and watch the budget and UEFA squad cost rule react in real time.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-surface font-sans text-zinc-200">
        <FtsProvider>
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">{children}</main>
          <Footer />
        </FtsProvider>
      </body>
    </html>
  );
}
