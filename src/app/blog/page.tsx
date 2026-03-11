"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import config from "@/data/config";

interface Post {
    id: string;
    title: string;
    excerpt: string;
    image_url: string;
    video_url?: string;
    category: string;
    created_at: string;
}

export default function BlogPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from("posts")
                .select("*")
                .order("created_at", { ascending: false });

            if (data) setPosts(data);
            setLoading(false);
        };
        fetchPosts();
    }, []);

    return (
        <main className="min-h-screen pt-32 pb-20">
            <section className="px-6 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <p className="text-xs uppercase tracking-widest text-primary mb-4 font-mono">{config.blog.pageLabel}</p>
                    <h1 className="text-4xl md:text-6xl font-bold text-foreground font-display mb-6">
                        {config.blog.pageTitle} <span className="gradient-text">{config.blog.pageAccent}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                        {config.blog.description}
                    </p>
                </motion.div>

                {/* Blog Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="glass-card h-96 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {posts.map((post, i) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card overflow-hidden group cursor-pointer flex flex-col"
                            >
                                {/* Media Container */}
                                <div className="relative h-56 bg-gradient-to-br from-primary/10 to-accent/5 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

                                    {post.image_url ? (
                                        <img
                                            src={post.image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-6xl font-display font-bold text-foreground/5 opacity-20">
                                                {post.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-full bg-background/40 backdrop-blur-md border border-foreground/10 text-[10px] font-mono text-foreground/70">
                                        {post.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 mb-3">
                                        <span className="text-xs text-foreground/40 font-mono">
                                            {new Date(post.created_at).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                                        {post.title}
                                    </h2>

                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
                                        <span className="text-xs font-medium text-primary flex items-center gap-2">
                                            Read More
                                            <ArrowUpRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}

                {!loading && posts.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-foreground/10 rounded-3xl">
                        <p className="text-gray-500 font-mono">No posts found. Check back soon!</p>
                    </div>
                )}
            </section>
        </main>
    );
}
