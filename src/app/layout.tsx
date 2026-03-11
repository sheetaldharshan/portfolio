import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Sacramento, Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
  title: config.metadata.title,
  description: config.metadata.description,
  icons: {
    icon: config.personal.logoUrl,
    shortcut: config.personal.logoUrl,
    apple: config.personal.logoUrl,
  },
  openGraph: {
    title: config.metadata.ogTitle,
    description: config.metadata.ogDescription,
    type: "website",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { SmoothScroll } from "@/components/layout/SmoothScroll";

import { StarsBackground } from "@/components/ui/StarsBackground";
import { ShootingStars } from "@/components/ui/ShootingStars";
import { SiteAssistantWidget } from "@/components/layout/SiteAssistantWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} ${mono.variable} ${signature.variable} ${modern.variable} ${elnath.variable} ${pavelt.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans bg-background text-foreground transition-colors duration-300">
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
            <Navbar />
            {children}
            <Footer />
            <SiteAssistantWidget />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
