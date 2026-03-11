"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Mail, ChevronRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
            else router.push("/admin/blog");
        } catch (err) { setError("An unexpected error occurred"); }
        finally { setLoading(false); }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#09090b] px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Admin Access</h1>
                    <p className="text-gray-400 text-sm font-mono">Secure login for Sheetal Dharshan</p>
                </div>
                <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-8 backdrop-blur-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-foreground/50 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-11 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-foreground/50 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-11 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-lg">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-purple-600 text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-700 transition-all disabled:opacity-50">
                            {loading ? "Verifying..." : "Login to Dashboard"}
                            {!loading && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            </motion.div>
        </main>
    );
}
