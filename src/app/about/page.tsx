"use client";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { Code2, Palette, Cpu, Rocket } from "lucide-react";
import config from "@/data/config";

const { aboutPage } = config as any;
const about = config.about;

const iconMap: Record<string, React.ElementType> = { Code2, Palette, Cpu, Rocket };

const values = about.values.map((v) => ({
    icon: iconMap[v.iconKey] || Code2,
    title: v.title,
    description: v.description,
}));

export default function AboutPage() {
    return (
        <main className="min-h-screen pt-32 pb-20">
            {/* Hero */}
            <section className="px-6 max-w-5xl mx-auto mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <p className="text-xs uppercase tracking-widest text-primary mb-4 font-mono">{about.pageLabel}</p>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground font-display mb-6">
                        {about.pageTitle}{" "}
                        <span className="gradient-text">{about.pageAccent}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        {about.bio}
                    </p>
                </motion.div>
            </section>

            {/* Values / Approach */}
            <section className="px-6 max-w-7xl mx-auto mb-20">
                <SectionHeader title="My" accent="Approach" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {values.map((value, i) => (
                        <GlassCard key={value.title} delay={i * 0.1} className="p-6">
                            <div className="mb-4 p-3 bg-foreground/5 rounded-lg w-fit group-hover:bg-primary/10 transition-colors">
                                <value.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Timeline */}
            <section className="px-6 max-w-4xl mx-auto mb-20">
                <SectionHeader title="My" accent="Journey" />
                <div className="relative">
                    {/* Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/30 to-transparent" />

                    <div className="space-y-12">
                        {about.timeline.map((item, i) => (
                            <motion.div
                                key={item.year}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="flex items-start gap-6 relative"
                            >
                                {/* Dot */}
                                <div className="relative z-10 w-16 flex-shrink-0">
                                    <div className="w-4 h-4 rounded-full bg-primary border-2 border-background mt-1 ml-[22px]" />
                                </div>

                                {/* Content */}
                                <div className="glass-card p-6 flex-1">
                                    <span className="text-xs font-mono text-primary mb-1 block">{item.year}</span>
                                    <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Personal Note */}
            <section className="px-6 max-w-3xl mx-auto">
                <GlassCard className="p-8 md:p-12 text-center">
                    <p className="text-lg md:text-xl text-foreground/80 leading-relaxed italic font-display">
                        &quot;{about.personalQuote}&quot;
                    </p>
                    <p className="text-sm text-primary mt-4 font-mono">{about.quoteAuthor}</p>
                </GlassCard>
            </section>
        </main>
    );
}
