"use client";
import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { useTheme } from "next-themes";

export const Globe = ({ scale = 1 }: { scale?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme, resolvedTheme } = useTheme();
    const currentTheme = resolvedTheme || theme;

    useEffect(() => {
        let phi = 0;
        if (!canvasRef.current) return;

        const isDark = currentTheme === "dark";

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 600 * 2,
            height: 600 * 2,
            phi: 0,
            theta: 0,
            dark: isDark ? 1 : 0,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: isDark ? 6 : 12,
            baseColor: isDark ? [0.3, 0.3, 0.3] : [1, 1, 1],
            markerColor: isDark ? [1, 0.8, 0] : [0.5, 0.4, 0],
            glowColor: isDark ? [1, 0.8, 0.2] : [0.9, 0.9, 0.9],
            markers: [
                { location: [28.6139, 77.2090], size: 0.1 },
                { location: [51.5074, -0.1278], size: 0.1 },
                { location: [40.7128, -74.0060], size: 0.1 },
                { location: [35.6762, 139.6503], size: 0.05 },
                { location: [-33.8688, 151.2093], size: 0.05 },
                { location: [-23.5505, -46.6333], size: 0.05 },
            ],
            onRender: (state) => {
                state.phi = phi;
                phi += 0.007; // Slightly faster spin
            },
        });

        return () => {
            globe.destroy();
        };
    }, [currentTheme]);

    return (
        <div className="absolute bottom-[-70%] right-[-10%] w-[500px] md:w-[600px] aspect-square pointer-events-none overflow-visible transition-all duration-300">
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    contain: "layout paint opacity",
                    transform: `scale(${scale})`,
                }}
            />
        </div>
    );
};
