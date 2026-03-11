import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroBrandMarkProps {
    className?: string;
    priority?: boolean;
}

export const HeroBrandMark = ({ className, priority = false }: HeroBrandMarkProps) => {
    return (
        <div className={cn("relative aspect-square", className)} aria-hidden="true">
            <Image
                src="/hero-logo.svg"
                alt=""
                fill
                priority={priority}
                className="object-contain"
                sizes="(min-width: 1280px) 480px, (min-width: 768px) 360px, 260px"
            />
        </div>
    );
};
