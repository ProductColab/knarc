import type { Metadata } from "next";
import Providers from "./providers";
import localFont from "next/font/local";
import "./globals.css";
import { ConfigGuard } from "./[configId]/components/config-guard";
import { AppSidebar } from "@/components/ui/AppSidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Knarc",
  description:
    "A powerful tool for exploring and managing your Knack application schema",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          min-h-screen bg-background text-foreground antialiased
          selection:bg-primary/20 selection:text-primary
          overflow-x-hidden
        `}
      >
        <Providers>
          <AppSidebar />
          <ConfigGuard>
            <main className="flex-1 p-4 md:p-6">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </ConfigGuard>

          {/* Ambient background glow */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--cyber-purple))_0%,rgba(0,0,0,0)_50%)] opacity-[0.15]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--cyber-red))_0%,rgba(0,0,0,0)_50%)] opacity-[0.1]" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
