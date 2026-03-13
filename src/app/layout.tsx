import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { AppHeader } from "@/components/layout/AppHeader";
import { NightSky } from "@/components/layout/NightSky";
import { SessionTracker } from "@/components/layout/SessionTracker";

const fontMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyDesk",
  description: "기획자를 위한 올인원 업무 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${fontMono.variable} min-h-dvh antialiased`}
      >
        <NightSky />
        <SessionTracker />
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
