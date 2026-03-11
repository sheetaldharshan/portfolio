"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const GlassCard = ({
    children,
    className,
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay }}
            className={cn("glass-card group p-6", className)}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
