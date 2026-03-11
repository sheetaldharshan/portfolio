"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Logo } from "@/components/ui/Logo";
import config from "@/data/config";

const navLinks = config.navigation.links;

export const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
        setScrolled(latest > 20);
    });

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [mobileOpen]);

    return (
        <>
            <motion.nav
                variants={{
                    visible: { y: 0 },
                    hidden: { y: -100 },
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={cn(
                    "fixed top-0 inset-x-0 z-50 transition-all duration-300",
                    scrolled
                        ? "h-16 bg-background/50 backdrop-blur-xl border-b border-primary/30 shadow-2xl shadow-primary/5 supports-[backdrop-filter]:bg-background/20"
                        : "h-20 bg-transparent border-b border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
                    {/* Left - Logo */}
                    <div className="w-1/4 flex justify-start">
                        <Link
                            href="/"
                            className="flex items-center gap-2 group z-50 relative"
                            onClick={() => setMobileOpen(false)}
                        >
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Logo className="relative z-10 w-full h-full" />
                            </div>
                            <span className="font-bold text-lg leading-none text-foreground tracking-tight font-mono group-hover:text-primary/90 transition-colors hidden sm:inline-block">
                                {config.personal.navDisplayName}
                            </span>
                        </Link>
                    </div>

                    {/* Center - Desktop Navigation */}
                    <div className="hidden md:flex flex-1 justify-center">
                        <div className="flex items-center gap-1 bg-foreground/5 rounded-full p-1 border border-foreground/5 backdrop-blur-md">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={cn(
                                            "relative px-5 py-2 rounded-full text-xs lg:text-sm font-medium transition-all duration-300",
                                            isActive ? "text-foreground" : "text-gray-400 hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                className="absolute inset-0 bg-foreground/10 rounded-full border border-primary/50 shadow-[0_0_10px_-2px_rgba(124,58,237,0.5)]"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className="relative z-10">{link.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right - CTA */}
                    <div className="w-1/4 flex justify-end items-center gap-4">
                        <div className="hidden md:block">
                            <Link
                                href={config.navigation.ctaHref}
                                className={cn(
                                    "px-5 py-2 rounded-full text-sm font-bold transition-all duration-300",
                                    pathname === config.navigation.ctaHref
                                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)]"
                                        : "bg-foreground/10 border border-foreground/10 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)]"
                                )}
                            >
                                {config.navigation.ctaLabel}
                            </Link>
                        </div>
                        <AnimatedThemeToggler className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 text-foreground hover:bg-foreground/10" />

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden text-foreground p-2 focus:outline-none z-50 group"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            <div className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center group-active:scale-95 transition-all">
                                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </div>
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl pt-24 px-6 md:hidden flex flex-col"
                    >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px] pointer-events-none opacity-30" />

                        <div className="flex flex-col gap-4 relative z-10 flex-1">
                            {[...navLinks, { name: config.navigation.ctaLabel, href: config.navigation.ctaHref }].map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between p-5 rounded-2xl transition-all border border-transparent",
                                            pathname === link.href
                                                ? "bg-foreground/10 text-foreground border-foreground/10 shadow-lg"
                                                : "text-gray-400 hover:bg-foreground/5 hover:text-foreground hover:border-foreground/5"
                                        )}
                                    >
                                        <span className="text-xl font-medium tracking-wide">{link.name}</span>
                                        <ChevronRight
                                            className={cn(
                                                "w-5 h-5 transition-transform",
                                                pathname === link.href ? "text-primary translate-x-0" : "opacity-30 -translate-x-2"
                                            )}
                                        />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-10"
                        >
                            <div className="flex justify-center pt-6 pb-2">
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                                    {config.navigation.mobileFooterText}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
