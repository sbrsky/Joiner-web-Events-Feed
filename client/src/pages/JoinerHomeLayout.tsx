import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FeaturedCard } from "@/components/ui/featured-card";
import { EventCard } from "@/components/ui/event-card";
import { Bell, Search, Filter, Sparkles, Zap, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const CATEGORIES = [
    { name: "For You", icon: Sparkles },
    { name: "Trending", icon: Flame },
    { name: "New", icon: Zap },
    { name: "Sports", icon: null },
    { name: "Music", icon: null },
    { name: "Tech", icon: null },
];

export function JoinerHomeLayout({
    activeCategory,
    setActiveCategory,
    featuredQuery,
    upcomingQuery,
    topPicks,
    upcomingEvents
}: any) {
    return (
        <div className="min-h-screen bg-background text-foreground pb-20 font-sans selection:bg-primary/20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass backdrop-blur-xl border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-lg">
                        J
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight">JOINER</span>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    </button>
                </div>
            </header>

            <main className="pt-20 space-y-8">
                {/* Categories */}
                <div className="px-0">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max space-x-3 px-6 pb-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                    ${activeCategory === cat.name
                                            ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105"
                                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                        }
                  `}
                                >
                                    {cat.icon && <cat.icon className={`w-3.5 h-3.5 ${activeCategory === cat.name ? "text-primary" : ""}`} />}
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" className="hidden" />
                    </ScrollArea>
                </div>

                {/* Top Picks Carousel */}
                <section className="space-y-4">
                    <div className="px-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold font-display">Don't Miss Out 🔥</h2>
                        <button className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wide">
                            View All
                        </button>
                    </div>

                    {featuredQuery.error && (
                        <div className="px-6 py-4 rounded-2xl bg-destructive/10 text-destructive text-sm">
                            {typeof featuredQuery.error.message === "string" && featuredQuery.error.message.length > 500
                                ? featuredQuery.error.message.slice(0, 500) + "…"
                                : featuredQuery.error.message}
                        </div>
                    )}
                    {featuredQuery.isLoading ? (
                        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-4 flex gap-4">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="w-[400px] h-[65vh] rounded-[2rem] shrink-0" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-4 flex gap-4">
                            {topPicks.length > 0 ? (
                                topPicks.map((event: any) => (
                                    <FeaturedCard key={event.id} event={event} />
                                ))
                            ) : (
                                <p className="px-6 text-muted-foreground text-sm">No featured events</p>
                            )}
                        </div>
                    )}
                </section>

                {/* Upcoming List */}
                <section className="px-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold font-display">Upcoming Events</h2>
                        <button className="p-2 rounded-full bg-white/5 hover:bg-white/10">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    {upcomingQuery.isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-[1.5rem]" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event: any, index: number) => (
                                    <EventCard key={event.id} event={event} index={index + 2} />
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">No upcoming events</p>
                            )}

                            {upcomingQuery.hasNextPage && (
                                <button
                                    onClick={() => upcomingQuery.fetchNextPage()}
                                    disabled={upcomingQuery.isFetchingNextPage}
                                    className="w-full py-3 mt-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                                >
                                    {upcomingQuery.isFetchingNextPage ? "Loading..." : "Load More"}
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {/* Floating Action Button (Optional for webview, but good for app feel) */}
            <div className="fixed bottom-6 right-6 z-40">
                <button className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform">
                    <span className="text-2xl font-light">+</span>
                </button>
            </div>
        </div>
    );
}
