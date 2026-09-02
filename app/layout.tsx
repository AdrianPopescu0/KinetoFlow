import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KinetoFlow",
  description:
    "Platformă clinică pentru kinetoterapie: autentificare securizată, programe și progresul pacienților.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full max-w-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-full max-w-full flex-col overflow-x-hidden bg-slate-50 text-slate-800">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
