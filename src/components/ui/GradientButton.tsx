import Link from "next/link";
import { cn } from "@/lib/utils";

const GradientButton = ({
    children,
    href,
    className,
    onClick,
}: {
    children: React.ReactNode;
    href?: string;
    className?: string;
    onClick?: () => void;
}) => {
    const classes = cn(
        "relative inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white transition-all duration-300",
        "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.6)] hover:-translate-y-0.5 border border-purple-500/50",
        "bg-[length:200%_auto] hover:bg-[position:100%_center]",
        className
    );

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={classes}>
            {children}
        </button>
    );
};

export default GradientButton;
