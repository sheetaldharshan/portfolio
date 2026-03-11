"use client";
import { motion } from "framer-motion";
import {
    Code2, Database, Cloud, Palette, Terminal, Cpu,
    Globe, Layers, Zap, Shield, GitBranch, Container,
} from "lucide-react";
import config from "@/data/config";

const { skillsMarquee } = config.home;

const iconMap: Record<string, React.ElementType> = {
    Code2, Database, Cloud, Palette, Terminal, Cpu,
    Globe, Layers, Zap, Shield, GitBranch, Container,
};

const skills = skillsMarquee.skills.map((s) => ({
    name: s.name,
    icon: iconMap[s.iconKey] || Code2,
}));

const SkillChip = ({ name, icon: Icon }: { name: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.06] whitespace-nowrap flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground/70 font-medium">{name}</span>
    </div>
);

export const SkillsMarquee = () => {
    return (
        <section className="py-20 overflow-hidden border-t border-foreground/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
            >
                <p className="text-xs uppercase tracking-widest text-foreground/40 mb-2 font-mono">{skillsMarquee.sectionLabel}</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                    {skillsMarquee.sectionTitle} <span className="gradient-text">{skillsMarquee.sectionAccent}</span>
                </h2>
            </motion.div>

            {/* Row 1 - Left to Right */}
            <div className="relative mb-4">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
                <div className="flex animate-marquee gap-4" style={{ "--marquee-duration": "25s" } as React.CSSProperties}>
                    {[...skills, ...skills].map((skill, i) => (
                        <SkillChip key={`${skill.name}-${i}`} name={skill.name} icon={skill.icon} />
                    ))}
                </div>
            </div>

            {/* Row 2 - Right to Left */}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
                <div
                    className="flex animate-marquee gap-4"
                    style={{
                        "--marquee-duration": "30s",
                        animationDirection: "reverse",
                    } as React.CSSProperties}
                >
                    {[...skills.slice().reverse(), ...skills.slice().reverse()].map((skill, i) => (
                        <SkillChip key={`rev-${skill.name}-${i}`} name={skill.name} icon={skill.icon} />
                    ))}
                </div>
            </div>
        </section>
    );
};
