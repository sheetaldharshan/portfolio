export default function WorkLoading() {
    return (
        <main className="min-h-screen pt-32 pb-20">
            <section className="px-6 max-w-7xl mx-auto">
                <div className="text-center mb-12 space-y-4">
                    <div className="mx-auto h-3 w-24 rounded-full bg-foreground/10 animate-pulse" />
                    <div className="mx-auto h-10 md:h-14 w-72 md:w-[520px] rounded-2xl bg-foreground/10 animate-pulse" />
                    <div className="mx-auto h-4 w-80 md:w-[620px] rounded-full bg-foreground/10 animate-pulse" />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-9 w-24 rounded-full bg-foreground/10 animate-pulse" />
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-card overflow-hidden h-[420px]">
                            <div className="h-48 bg-foreground/10 animate-pulse" />
                            <div className="p-6 space-y-4">
                                <div className="h-6 w-2/3 rounded bg-foreground/10 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-full rounded bg-foreground/10 animate-pulse" />
                                    <div className="h-3 w-5/6 rounded bg-foreground/10 animate-pulse" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-6 w-16 rounded bg-foreground/10 animate-pulse" />
                                    <div className="h-6 w-20 rounded bg-foreground/10 animate-pulse" />
                                    <div className="h-6 w-14 rounded bg-foreground/10 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
