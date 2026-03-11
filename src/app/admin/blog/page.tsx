"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import GlassCard from "@/components/ui/GlassCard";
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, Video } from "lucide-react";

interface Post {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    image_url: string;
    video_url: string;
    category: string;
    created_at: string;
}

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Post>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
        if (data) setPosts(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (isEditing === "new") {
            await supabase.from("posts").insert([formData]);
        } else {
            await supabase.from("posts").update(formData).eq("id", isEditing);
        }
        setIsEditing(null);
        setFormData({});
        fetchPosts();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this post?")) {
            await supabase.from("posts").delete().eq("id", id);
            fetchPosts();
        }
    };

    return (
        <main className="min-h-screen bg-[#09090b] pt-32 pb-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold text-foreground">Manage Blog</h1>
                    <button
                        onClick={() => { setIsEditing("new"); setFormData({}); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 rounded-full text-foreground text-sm font-medium hover:bg-purple-700 transition-all"
                    >
                        <Plus className="w-4 h-4" /> New Post
                    </button>
                </div>

                {isEditing && (
                    <GlassCard className="p-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-foreground">{isEditing === "new" ? "Create New" : "Edit"} Post</h2>
                            <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:text-foreground"><X /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <input
                                placeholder="Post Title"
                                value={formData.title || ""}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none"
                            />
                            <input
                                placeholder="Category"
                                value={formData.category || ""}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none"
                            />
                            <textarea
                                placeholder="Excerpt (Short summary)"
                                value={formData.excerpt || ""}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                className="w-full md:col-span-2 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none h-24"
                            />
                            <textarea
                                placeholder="Full Content (Markdown supported)"
                                value={formData.content || ""}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full md:col-span-2 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none h-64"
                            />
                            <div className="relative">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                <input
                                    placeholder="Image URL"
                                    value={formData.image_url || ""}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-11 py-3 text-foreground focus:outline-none font-mono text-sm"
                                />
                            </div>
                            <div className="relative">
                                <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                <input
                                    placeholder="Video URL (Optional)"
                                    value={formData.video_url || ""}
                                    onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-11 py-3 text-foreground focus:outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full py-4 bg-purple-600 rounded-xl text-foreground font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" /> Save Changes
                        </button>
                    </GlassCard>
                )}

                <div className="grid gap-4">
                    {posts.map(post => (
                        <div key={post.id} className="group bg-foreground/5 border border-foreground/10 rounded-2xl p-6 flex items-center justify-between hover:bg-white/[0.08] transition-all">
                            <div>
                                <h3 className="text-foreground font-bold mb-1">{post.title}</h3>
                                <p className="text-gray-400 text-xs font-mono">{post.category} • {new Date(post.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setIsEditing(post.id); setFormData(post); }} className="p-2 rounded-lg bg-foreground/5 text-gray-400 hover:text-foreground transition-all"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-foreground transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && !loading && (
                        <div className="text-center py-24 border border-dashed border-foreground/10 rounded-3xl">
                            <p className="text-gray-500 font-mono">No posts found. Start writing!</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
