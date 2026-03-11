"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 30 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXRelative = (event.clientX - rect.left) / width - 0.5;
        const mouseYRelative = (event.clientY - rect.top) / height - 0.5;
        x.set(mouseXRelative);
        y.set(mouseYRelative);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("group cursor-pointer perspective-1000", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY }}
        >
            <defs>
                <linearGradient id="prism-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" /> {/* Violet */}
                    <stop offset="40%" stopColor="#d946ef" /> {/* Fuchsia */}
                    <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
                </linearGradient>

                <radialGradient id="prism-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>

                <filter id="hyper-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.2  0 0 0 0 0.9  0 0 0 0.6 0" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Orbital Rings - Tech backdrop */}
            <motion.circle
                cx="50" cy="50" r="48"
                stroke="url(#prism-grad-1)"
                strokeWidth="0.5"
                strokeDasharray="2 6"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="opacity-30"
            />

            {/* The "S" Component - Abstract Polygons */}
            <motion.path
                d="M 45 25 L 20 35 L 20 45 L 45 55 L 45 65 L 20 75"
                stroke="url(#prism-grad-1)"
                strokeWidth="8"
                strokeLinecap="square"
                filter="url(#hyper-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                whileHover={{ strokeWidth: 10, scale: 1.05 }}
            />

            {/* The "D" Component - Abstract Polygons */}
            <motion.path
                d="M 55 25 V 75 L 85 60 V 40 Z"
                stroke="url(#prism-grad-1)"
                strokeWidth="8"
                strokeLinecap="square"
                strokeLinejoin="miter"
                filter="url(#hyper-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                whileHover={{ strokeWidth: 10, scale: 1.05 }}
            />

            {/* Central Prism - Glass Core */}
            <motion.path
                d="M 50 40 L 60 50 L 50 60 L 40 50 Z"
                fill="url(#prism-grad-1)"
                className="opacity-20 mix-blend-screen"
                animate={{ scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating Spark Points */}
            <motion.circle
                cx="50" cy="50" r="2"
                fill="white"
                filter="url(#hyper-glow)"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </motion.svg>
    );
};
