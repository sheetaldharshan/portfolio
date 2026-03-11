import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import config from "@/data/config";

const footerLinks = [...config.navigation.links, { name: config.navigation.ctaLabel, href: config.navigation.ctaHref }];

const socialIconMap: Record<string, React.ElementType> = {
    Github, Twitter, Linkedin, Mail,
};

const socialLinks = config.social.links.map((s) => ({
    icon: socialIconMap[s.icon] || Mail,
    href: s.url,
    label: s.platform,
}));

export const Footer = () => {
    return (
        <footer className="relative border-t border-foreground/5 bg-background">
            <div className="absolute inset-0 bg-radial-bottom pointer-events-none" />
            <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Logo className="w-12 h-12" />
                            <span className="font-mono font-bold text-foreground text-lg">{config.personal.navDisplayName}</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            {config.footer.tagline}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-foreground/40 mb-4 font-mono">Navigation</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {footerLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center gap-1 group"
                                >
                                    {link.name}
                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Socials */}
                    <div>
                        <h3 className="text-xs uppercase tracking-widest text-foreground/40 mb-4 font-mono">Connect</h3>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 hover:border-primary/30 transition-all"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-foreground/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-600 font-mono">
                        © {new Date().getFullYear()} {config.footer.copyright}. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-600 font-mono">
                        {config.footer.builtWith}
                    </p>
                </div>
            </div>
        </footer>
    );
};
