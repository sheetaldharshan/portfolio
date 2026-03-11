"use client";
import { motion } from "framer-motion";

const SectionHeader = ({
    title,
    accent,
    subtitle,
}: {
    title: string;
    accent: string;
    subtitle?: string;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
        >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground font-display">
                {title} <span className="gradient-text italic">{accent}</span>
            </h2>
            {subtitle && (
                <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-sm md:text-base">{subtitle}</p>
            )}
        </motion.div>
    );
};

export default SectionHeader;
