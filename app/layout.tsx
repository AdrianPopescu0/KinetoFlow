import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KinetoFlow",
  description:
    "Platformă clinică pentru kinetoterapie: autentificare securizată, programe și progresul pacienților.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "KinetoFlow",
    statusBarStyle: "default",
  },
}

export const viewport = {
  themeColor: "#042f2e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen max-w-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-screen max-w-full flex-col justify-between overflow-x-hidden bg-slate-50 text-slate-800">
        <Script id="pwa-install-capture" strategy="beforeInteractive">
          {`(function () {
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__pwaInstallPrompt = event;
  });
  window.addEventListener("appinstalled", function () {
    window.__pwaInstallPrompt = undefined;
  });
})();`}
        </Script>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
