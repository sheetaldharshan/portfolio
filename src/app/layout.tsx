import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Sacramento, Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import config from "@/data/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const signature = Sacramento({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-signature",
  display: "swap",
});

const modern = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-modern",
  display: "swap",
});

const elnath = localFont({
  src: "./fonts/ELNATH 700.otf",
  variable: "--font-elnath",
  display: "swap",
});

const pavelt = localFont({
  src: "./fonts/Pavelt 400.otf",
  variable: "--font-pavelt",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sheetaldharshan.me"),
  title: {
    default: config.metadata.title,
    template: `%s | SheetalDharshan A`,
  },
  description: config.metadata.description,
  keywords: [
    "Sheetal",
    "SheetalDharshan",
    "Full-Stack Developer",
    "AI Developer",
    "Portfolio",
    "Web Developer",
    "React",
    "Next.js",
  ],
  authors: [{ name: "SheetalDharshan A", url: "https://sheetaldharshan.me" }],
  creator: "SheetalDharshan A",
  icons: {
    icon: config.personal.logoUrl,
    shortcut: config.personal.logoUrl,
    apple: config.personal.logoUrl,
  },
  openGraph: {
    title: config.metadata.ogTitle,
    description: config.metadata.ogDescription,
    url: "https://sheetaldharshan.me",
    siteName: "SheetalDharshan A | Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: config.metadata.ogTitle,
    description: config.metadata.ogDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { AppChrome } from "@/components/layout/AppChrome";

import { StarsBackground } from "@/components/ui/StarsBackground";
import { ShootingStars } from "@/components/ui/ShootingStars";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} ${mono.variable} ${signature.variable} ${modern.variable} ${elnath.variable} ${pavelt.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans bg-background text-foreground transition-colors duration-300">
        {/* Pre-hydration: instantly cover viewport for first-visit loader (runs before React) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(!sessionStorage.getItem('sd_first_visit_loader_done')){document.documentElement.setAttribute('data-loading','')}}catch(e){}})()`,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Ambient Background Pattern */}
          <div className="fixed inset-0 z-[-1] min-h-screen w-full bg-background overflow-hidden">
            <AnimatedGridPattern
              numSquares={30}
              maxOpacity={0.1}
              duration={3}
              repeatDelay={1}
              className={
                "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)] inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 fill-black/5 stroke-black/5 dark:fill-white/5 dark:stroke-white/5"
              }
            />
            {/* Dark Mode Specific Global Stars */}
            <div className="absolute inset-0 z-0 hidden dark:block">
              <StarsBackground />
              <ShootingStars />
            </div>
          </div>

          <SmoothScroll>
            <AppChrome>{children}</AppChrome>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
