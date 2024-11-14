import type { Metadata } from "next";
import Providers from "./providers";
import localFont from "next/font/local";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
  title: "Knack Explorer",
  description:
    "A powerful tool for exploring and managing your Knack application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          <Providers>
            <AppSidebar />
            <main className="flex-1">
              <SidebarTrigger />
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
