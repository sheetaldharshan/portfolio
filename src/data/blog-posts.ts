export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readingTime: string;
    tags: string[];
    image: string;
    featured: boolean;
}

export const blogPosts: BlogPost[] = [
    {
        id: "modern-web-architecture",
        title: "Building Modern Web Architecture in 2026",
        excerpt: "A deep dive into the latest patterns and best practices for building scalable, maintainable web applications with Next.js and microservices.",
        date: "2026-02-15",
        readingTime: "8 min",
        tags: ["Architecture", "Next.js", "Web Dev"],
        image: "/images/blog-1.jpg",
        featured: true,
    },
    {
        id: "ai-in-development",
        title: "How AI is Transforming Developer Workflows",
        excerpt: "Exploring how AI tools are revolutionizing the way we write, test, and deploy code — and what it means for the future of software development.",
        date: "2026-02-01",
        readingTime: "6 min",
        tags: ["AI", "Productivity", "Tools"],
        image: "/images/blog-2.jpg",
        featured: true,
    },
    {
        id: "tailwind-design-systems",
        title: "Creating Design Systems with Tailwind CSS",
        excerpt: "How to build a cohesive, scalable design system using Tailwind CSS that keeps your team productive and your UI consistent.",
        date: "2026-01-20",
        readingTime: "10 min",
        tags: ["CSS", "Design", "Tailwind"],
        image: "/images/blog-3.jpg",
        featured: false,
    },
    {
        id: "framer-motion-guide",
        title: "The Ultimate Guide to Framer Motion Animations",
        excerpt: "Master micro-interactions and page transitions with Framer Motion — from basics to advanced spring physics and layout animations.",
        date: "2026-01-10",
        readingTime: "12 min",
        tags: ["Animation", "React", "Framer Motion"],
        image: "/images/blog-4.jpg",
        featured: false,
    },
];
