"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { Code2, Palette, Cpu, Globe, Send, ArrowRight, CheckCircle2 } from "lucide-react";
import config from "@/data/config";

const { hireMe } = config;

const iconMap: Record<string, React.ElementType> = { Code2, Palette, Cpu, Globe };

const services = hireMe.services.map((s) => ({
    icon: iconMap[s.iconKey] || Code2,
    title: s.title,
    description: s.description,
    features: s.features,
}));

export default function HireMePage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        project: "",
        budget: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

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
                    <p className="text-xs uppercase tracking-widest text-primary mb-4 font-mono">{hireMe.pageLabel}</p>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground font-display mb-6">
                        {hireMe.pageTitle}{" "}
                        <span className="gradient-text">{hireMe.pageAccent}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        {hireMe.description}
                    </p>
                </motion.div>
            </section>

            {/* Services */}
            <section className="px-6 max-w-7xl mx-auto mb-20">
                <SectionHeader title="What I" accent="Offer" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service, i) => (
                        <GlassCard key={service.title} delay={i * 0.1} className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-foreground/5 rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                                    <service.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-2">{service.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{service.description}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {service.features.map((f) => (
                                            <span key={f} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-foreground/5 text-foreground/50">
                                                <CheckCircle2 className="w-2.5 h-2.5 text-accent" />
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Process */}
            <section className="px-6 max-w-5xl mx-auto mb-20">
                <SectionHeader title="My" accent="Process" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {hireMe.processSteps.map((step, i) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-6 text-center relative"
                        >
                            <span className="text-4xl font-display font-bold text-primary/20 block mb-2">{step.step}</span>
                            <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                            {i < hireMe.processSteps.length - 1 && (
                                <ArrowRight className="hidden md:block absolute top-1/2 -right-5 w-4 h-4 text-foreground/20 -translate-y-1/2" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Contact Form */}
            <section className="px-6 max-w-2xl mx-auto">
                <SectionHeader title="Get in" accent="Touch" />
                <GlassCard className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-foreground/40 uppercase tracking-wider mb-1 block font-mono">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-foreground/40 uppercase tracking-wider mb-1 block font-mono">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="you@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-foreground/40 uppercase tracking-wider mb-1 block font-mono">Project Type</label>
                                <select
                                    value={formData.project}
                                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                >
                                    {hireMe.projectTypes.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-surface">{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-foreground/40 uppercase tracking-wider mb-1 block font-mono">Budget Range</label>
                                <select
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                >
                                    {hireMe.budgetRanges.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-surface">{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-foreground/40 uppercase tracking-wider mb-1 block font-mono">Message</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={4}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                placeholder="Tell me about your project..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-foreground bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)] transition-all"
                        >
                            {submitted ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Message Sent!
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                </GlassCard>
            </section>
        </main>
    );
}
