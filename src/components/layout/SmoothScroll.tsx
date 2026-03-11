"use client";
import { ReactLenis } from "@studio-freight/react-lenis";
import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

export function SmoothScroll({ children }: PropsWithChildren) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith("/admin");

    if (isAdminRoute) {
        return <>{children}</>;
    }

    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
            {children}
        </ReactLenis>
    );
}
