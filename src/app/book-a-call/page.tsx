"use client";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { Calendar, Clock, Globe, Video, MessageSquare, ArrowRight } from "lucide-react";
import config from "@/data/config";

const { bookACall } = config;

const iconMap: Record<string, React.ElementType> = { MessageSquare, Video, Calendar };

const callTypes = bookACall.callTypes.map((c) => ({
    icon: iconMap[c.iconKey] || Calendar,
    title: c.title,
    duration: c.duration,
    description: c.description,
    color: c.color,
}));

export default function BookACallPage() {
    return (
        <main className="min-h-screen pt-32 pb-20">
            {/* Hero */}
            <section className="px-6 max-w-5xl mx-auto mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <p className="text-xs uppercase tracking-widest text-primary mb-4 font-mono">{bookACall.pageLabel}</p>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground font-display mb-6">
                        {bookACall.pageTitle} <span className="gradient-text">{bookACall.pageAccent}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        {bookACall.description}
                    </p>
                </motion.div>
            </section>

            {/* Call Types */}
            <section className="px-6 max-w-5xl mx-auto mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {callTypes.map((call, i) => (
                        <GlassCard key={call.title} delay={i * 0.1} className="p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-foreground/5 rounded-lg">
                                    <call.icon className={`w-5 h-5 ${call.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">{call.title}</h3>
                                    <span className="text-xs text-foreground/40 font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {call.duration}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                                {call.description}
                            </p>
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-foreground/5 border border-foreground/10 text-foreground/70 hover:text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all">
                                Schedule <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Calendar Embed Placeholder */}
            <section className="px-6 max-w-4xl mx-auto mb-16">
                <GlassCard className="p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                            <Calendar className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">Calendar Integration</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                            Connect your Calendly or Cal.com account to enable direct scheduling.
                            Paste your embed code here to go live.
                        </p>
                        <div className="px-4 py-2 rounded-full bg-foreground/5 border border-foreground/10 text-xs font-mono text-foreground/40">
                            {/* Replace this div with your Calendly embed */}
                            {bookACall.calendarPlaceholder}
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* Availability */}
            <section className="px-6 max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-foreground font-display flex items-center justify-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        My Availability
                    </h2>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">Times shown in {bookACall.timezone}</p>
                </div>

                <div className="space-y-2">
                    {bookACall.availability.map((slot, i) => (
                        <motion.div
                            key={slot.day}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${slot.available ? "bg-green-500" : "bg-foreground/20"}`} />
                                <span className="text-sm font-medium text-foreground">{slot.day}</span>
                            </div>
                            <span className="text-sm text-muted-foreground font-mono">{slot.time}</span>
                        </motion.div>
                    ))}
                </div>
            </section>
        </main>
    );
}
