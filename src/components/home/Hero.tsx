"use client";
import React from "react";
import { motion } from "framer-motion";
import { ChatBot } from "./ChatBot";
import { Logo } from "@/components/ui/Logo";

export const Hero = () => {
    return (
        <section className="ref-hero relative min-h-[72vh] md:min-h-[82vh] flex flex-col items-center justify-start overflow-hidden bg-transparent">


            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center justify-start min-h-0">
                <div className="w-full pt-4 md:pt-8 pb-6 min-h-0">
                    <div className="flex flex-col gap-4 md:gap-6 min-h-0">
                        <motion.h2
                            className="font-display text-4xl md:text-6xl leading-[0.9] text-right"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <div>
                                <span className="ref-do-h2 italic">GET</span> 2 <span className="ref-do-h2 italic"> KNOW ME</span>
                            </div>
                        </motion.h2>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="w-full px-0 md:px-1 min-h-0"
                        >
                            <ChatBot isHeroVariant={true} />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};
