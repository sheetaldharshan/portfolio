"use client";
import React from "react";
import { motion } from "framer-motion";
import config from "@/data/config";

const { skillCategories } = config.home.whatIDo;

export const WhatIDoSection = () => {
    return (
        <section className="ref-whatido" id="whatido">
            {/* Left: Title */}
            <div className="ref-what-box !justify-end lg:!justify-start">
                <motion.h2
                    className="font-elnath uppercase tracking-wider opacity-90 text-right lg:text-left !text-5xl md:!text-6xl xl:!text-7xl !leading-tight !mr-0 !mb-6 lg:!mb-10"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    W<span className="ref-hat-h2 text-purple-400">HAT</span>
                    <span className="block">
                        I <span className="ref-do-h2 italic">DO</span>
                    </span>
                </motion.h2>
            </div>

            {/* Right: Skill Cards */}
            <div className="ref-what-box">
                <div className="w-full max-w-[480px] flex flex-col gap-4 md:gap-5 lg:ml-20 xl:ml-24">
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 backdrop-blur-md"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="absolute -top-14 -right-12 h-28 w-28 rounded-full bg-purple-500/20 blur-3xl" />
                        <div className="relative">
                            <h3 className="font-elnath text-[1.7rem] md:text-[1.85rem] uppercase tracking-wider opacity-95">{skillCategories.develop.title}</h3>
                            <h4 className="text-xs md:text-sm font-light tracking-wide text-foreground/60 mt-1">{skillCategories.develop.description}</h4>
                            <p className="text-sm md:text-base font-light leading-relaxed text-foreground/80 mt-3">{skillCategories.develop.details}</p>
                            <h5 className="text-[11px] md:text-xs font-light tracking-[0.12em] uppercase text-foreground/60 mt-4 mb-2">Skillset &amp; tools</h5>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {skillCategories.develop.tools.map((tool, index) => (
                                    <span
                                        key={index}
                                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] md:text-[10px] font-medium text-foreground/75 transition-colors hover:border-purple-400/40 hover:text-purple-300"
                                    >
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 backdrop-blur-md"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div className="absolute -top-14 -right-12 h-28 w-28 rounded-full bg-cyan-500/20 blur-3xl" />
                        <div className="relative">
                            <h3 className="font-elnath text-[1.7rem] md:text-[1.85rem] uppercase tracking-wider opacity-95">{skillCategories.design.title}</h3>
                            <h4 className="text-xs md:text-sm font-light tracking-wide text-foreground/60 mt-1">{skillCategories.design.description}</h4>
                            <p className="text-sm md:text-base font-light leading-relaxed text-foreground/80 mt-3">{skillCategories.design.details}</p>
                            <h5 className="text-[11px] md:text-xs font-light tracking-[0.12em] uppercase text-foreground/60 mt-4 mb-2">Skillset &amp; tools</h5>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {skillCategories.design.tools.map((tool, index) => (
                                    <span
                                        key={index}
                                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] md:text-[10px] font-medium text-foreground/75 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                                    >
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
