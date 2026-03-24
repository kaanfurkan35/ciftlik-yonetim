import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const firaCode = Fira_Code({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "\u00c7iftlik Y\u00f6netim",
    template: "%s | \u00c7iftlik Y\u00f6netim",
  },
  description: "B\u00fcy\u00fckba\u015f hayvan \u00e7iftli\u011fi y\u00f6netim uygulamas\u0131",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "\u00c7iftlik Y\u00f6netim",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2d6b3f" },
    { media: "(prefers-color-scheme: dark)", color: "#1a3328" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${firaSans.variable} ${firaCode.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
