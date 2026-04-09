import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "streamdown/styles.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/ui/mini-navbar";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { GlobalGradientBackground } from "@/components/ui/global-gradient-bg";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Meeting Minutes",
  description: "Record and summarize your meetings effortlessly.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider session={session}>
            <GlobalGradientBackground />
            <SmoothScroll>
              <Navbar />
              {children}
            </SmoothScroll>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
