export interface Project {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    image: string;
    tags: string[];
    category: string;
    link?: string;
    github?: string;
    featured: boolean;
}

export const projects: Project[] = [
    {
        id: "music-app",
        title: "Harmony Stream",
        description: "Full-stack music streaming platform with offline playback and smart playlists.",
        longDescription: "A complete music streaming experience built with React, Node.js, and PostgreSQL. Features include offline playback, AI-powered playlist generation, and real-time synchronization across devices.",
        image: "/images/project-1.jpg",
        tags: ["React", "Node.js", "PostgreSQL", "Redis", "WebSocket"],
        category: "Full-stack",
        link: "https://example.com",
        github: "https://github.com",
        featured: true,
    },
    {
        id: "analytics-dashboard",
        title: "InsightPulse",
        description: "Real-time analytics dashboard with interactive data visualizations.",
        longDescription: "Enterprise-grade analytics platform featuring real-time data streaming, customizable dashboards, and predictive analytics powered by machine learning models.",
        image: "/images/project-2.jpg",
        tags: ["Next.js", "Python", "FastAPI", "D3.js", "Redis"],
        category: "Dashboard",
        link: "https://example.com",
        featured: true,
    },
    {
        id: "ai-processor",
        title: "DocuMind AI",
        description: "Intelligent document extraction and processing tool powered by AI.",
        longDescription: "An AI-powered document processing tool that extracts, classifies, and summarizes documents with high accuracy. Built with Python, FastAPI, and integrated with multiple LLM providers.",
        image: "/images/project-3.jpg",
        tags: ["Python", "FastAPI", "OpenAI", "React", "Docker"],
        category: "AI/ML",
        github: "https://github.com",
        featured: true,
    },
    {
        id: "ecommerce",
        title: "ShopVibe",
        description: "Modern e-commerce platform with seamless checkout experience.",
        longDescription: "A high-conversion e-commerce platform with features like real-time inventory, Stripe payments, and a headless CMS for product management.",
        image: "/images/project-4.jpg",
        tags: ["Next.js", "Stripe", "Sanity", "Tailwind CSS"],
        category: "E-commerce",
        link: "https://example.com",
        featured: false,
    },
    {
        id: "portfolio-builder",
        title: "FolioKit",
        description: "Drag-and-drop portfolio builder for creative professionals.",
        longDescription: "A no-code portfolio builder with beautiful templates, custom domains, and SEO optimization. Built for designers, developers, and creatives.",
        image: "/images/project-5.jpg",
        tags: ["React", "TypeScript", "DnD Kit", "Supabase"],
        category: "SaaS",
        featured: false,
    },
    {
        id: "chat-platform",
        title: "Converso",
        description: "Real-time chat platform with video calls and file sharing.",
        longDescription: "A modern communication platform supporting text, voice, and video with end-to-end encryption, file sharing, and real-time collaboration features.",
        image: "/images/project-6.jpg",
        tags: ["Next.js", "WebRTC", "Socket.io", "MongoDB"],
        category: "Full-stack",
        featured: false,
    },
];

export const categories = ["All", "Full-stack", "Dashboard", "AI/ML", "E-commerce", "SaaS"];
