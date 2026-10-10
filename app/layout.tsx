import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import {
  DASHBOARD_THEME_BOOT_SCRIPT,
  parseThemePreference,
  THEME_COOKIE_NAME,
} from "@/lib/theme/preference";
import { cn } from "@/lib/utils";
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

const SITE_URL = "https://kinetoflow96.vercel.app"
const SITE_TITLE = "KinetoFlow"
const SITE_DESCRIPTION =
  "Platformă clinică pentru kinetoterapie: optimizează activitatea cabinetului, programele de recuperare și accesul securizat."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    locale: "ro_RO",
    type: "website",
    images: [
      {
        url: "/landing/hero-recovery.jpg",
        width: 2400,
        height: 1600,
        alt: "KinetoFlow — ședință de kinetoterapie și recuperare medicală",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/landing/hero-recovery.jpg"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cookie-ul e singura sursă sigură pe server (fără localStorage / matchMedia).
  // Pentru "system", boot script-ul aliniază DOM-ul înainte de hidratare;
  // suppressHydrationWarning evită mismatch-ul pe class / data-theme / color-scheme.
  const jar = await cookies()
  const preference = parseThemePreference(jar.get(THEME_COOKIE_NAME)?.value)
  const ssrTheme = preference === "dark" || preference === "light" ? preference : undefined

  return (
    <html
      lang="ro"
      suppressHydrationWarning
      data-theme={ssrTheme}
      style={ssrTheme ? { colorScheme: ssrTheme } : undefined}
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "min-h-screen max-w-full overflow-x-hidden antialiased",
        ssrTheme === "dark" && "dark",
      )}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-screen max-w-full flex-col justify-between overflow-x-hidden bg-slate-50 text-slate-800 dark:bg-[var(--kf-canvas)] dark:text-[var(--kf-text)]"
      >
        <Script id="dashboard-theme-boot" strategy="beforeInteractive">
          {DASHBOARD_THEME_BOOT_SCRIPT}
        </Script>
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
