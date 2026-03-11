"use client";
import React from "react";
import { motion } from "framer-motion";
import config from "@/data/config";

const { about } = config.home;

export const AboutSection = () => {
    return (
        <section className="ref-about relative flex items-center justify-center py-20 lg:py-32" id="about">
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 flex justify-end">
                <div className="w-full lg:w-[45%] xl:w-[40%]">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="mb-4 lg:mb-6"
                    >
                        <h2 className="font-elnath text-xl md:text-3xl lg:text-4xl tracking-wider uppercase opacity-90 text-right lg:text-left">
                            A<span className="italic text-purple-400">BOUT</span> ME
                        </h2>
                        <div className="h-0.5 w-12 bg-purple-500/50 mt-2 rounded-full lg:ml-0 ml-auto" />
                    </motion.div>

                    <div className="flex flex-col gap-5">
                        {/* Bio Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="p-5 md:p-6 rounded-2xl relative overflow-hidden group"
                        >
                            {/* Subtle corner glow */}
                            <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />

                            <p className="text-sm md:text-base lg:text-lg font-light leading-relaxed text-slate-300"
                                dangerouslySetInnerHTML={{ __html: about.bio }}
                            />

                            <p className="mt-3 text-[11px] md:text-xs text-slate-400 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: about.bioSub }}
                            />

                            {/* Skill Tags */}
                            <div className="mt-6 flex flex-wrap gap-1.5 md:gap-2">
                                {about.skills.map((skill, idx) => (
                                    <motion.span
                                        key={skill}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.05 * idx }}
                                        whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.1) border-white/20" }}
                                        className="px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium bg-white/5 border border-white/10 text-slate-400 transition-colors"
                                    >
                                        {skill}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Side Content Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                            {/* Persona Code */}
                            <motion.div
                                initial={{ opacity: 0, x: 15 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="bg-[#0f111a]/80 backdrop-blur-md border border-white/5 p-4 rounded-xl font-mono text-[11px] leading-relaxed relative overflow-hidden"
                            >
                                <div className="flex gap-1 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                                </div>
                                <div className="text-purple-400">const <span className="text-blue-400">dev</span> = &#123;</div>
                                <div className="pl-3 truncate">
                                    <span className="text-slate-400">name:</span> <span className="text-amber-200">&quot;{about.codeBlock.name}&quot;</span>,
                                </div>
                                <div className="pl-3 truncate">
                                    <span className="text-slate-400">passion:</span> <span className="text-amber-200">&quot;{about.codeBlock.passion}&quot;</span>,
                                </div>
                                <div className="pl-3">
                                    <span className="text-slate-400">mode:</span> <span className="text-amber-200">&quot;{about.codeBlock.mode}&quot;</span>
                                </div>
                                <div className="text-purple-400">&#125;;</div>
                            </motion.div>

                            {/* Quote Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 15 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="p-4 bg-gradient-to-br from-purple-500/5 to-transparent border border-white/5 rounded-xl flex flex-col justify-center"
                            >
                                <div className="text-purple-400 text-lg mb-1 leading-none">&ldquo;</div>
                                <p className="text-[10px] md:text-[11px] text-slate-400 italic leading-snug">
                                    {about.quote}
                                </p>
                                <div className="text-purple-400 text-lg mt-1 text-right leading-none">&rdquo;</div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
