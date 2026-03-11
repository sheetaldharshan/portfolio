"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import config, { projects, projectCategories } from "@/data/config";

export default function WorkPage() {
    const [activeCategory, setActiveCategory] = useState("All");

    const filtered = activeCategory === "All"
        ? projects
        : projects.filter((p) => p.category === activeCategory);

    return (
        <main className="min-h-screen pt-32 pb-20">
            <section className="px-6 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <p className="text-xs uppercase tracking-widest text-primary mb-4 font-mono">{config.work.pageLabel}</p>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground font-display mb-6">
                        {config.work.pageTitle} <span className="gradient-text">{config.work.pageAccent}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                        {config.work.description}
                    </p>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-2 mb-12"
                >
                    {projectCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                activeCategory === cat
                                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)]"
                                    : "bg-foreground/5 text-foreground/60 border border-foreground/10 hover:text-foreground hover:bg-foreground/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </motion.div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((project, i) => (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                            >
                                <div className="glass-card overflow-hidden group cursor-pointer h-full flex flex-col">
                                    {/* Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-10" />
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-4xl font-display font-bold text-foreground/10 group-hover:text-foreground/20 transition-colors">
                                                {project.title.charAt(0)}
                                            </span>
                                        </div>
                                        {project.featured && (
                                            <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-mono text-primary">
                                                Featured
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                            {project.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                                            {project.description}
                                        </p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {project.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 rounded-md text-[10px] font-medium bg-foreground/5 border border-foreground/10 text-foreground/50"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {project.tags.length > 3 && (
                                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-foreground/5 text-foreground/30">
                                                    +{project.tags.length - 3}
                                                </span>
                                            )}
                                        </div>

                                        {/* Links */}
                                        <div className="flex items-center gap-3 pt-3 border-t border-foreground/5">
                                            {project.link && (
                                                <a
                                                    href={project.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-primary transition-colors"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Live Demo
                                                </a>
                                            )}
                                            {project.github && (
                                                <a
                                                    href={project.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground transition-colors"
                                                >
                                                    <Github className="w-3.5 h-3.5" />
                                                    Source
                                                </a>
                                            )}
                                            <div className="flex-1" />
                                            <ArrowUpRight className="w-4 h-4 text-foreground/20 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </section>
        </main>
    );
}
