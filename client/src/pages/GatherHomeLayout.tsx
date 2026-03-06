import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Bell, Search, Filter, Calendar, MapPin, Heart, Sparkles, X, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AppDownloadDrawer, type DrawerType } from "@/components/ui/app-download-drawer";
import { encodeEventId } from "@/lib/idUtils";
import { useAuth } from "@/hooks/useAuth";

const getEventGroup = (rawDate: string) => {
    if (!rawDate) return "Later";
    const eventDate = new Date(rawDate);
    const time = eventDate.getTime();
    if (isNaN(time)) return "Later";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const currentMonday = new Date(today);
    currentMonday.setDate(diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    const currentFriday = new Date(currentMonday);
    currentFriday.setDate(currentMonday.getDate() + 4);
    currentFriday.setHours(23, 59, 59, 999);

    const currentSaturday = new Date(currentMonday);
    currentSaturday.setDate(currentMonday.getDate() + 5);
    currentSaturday.setHours(0, 0, 0, 0);

    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    currentSunday.setHours(23, 59, 59, 999);

    if (time >= currentMonday.getTime() && time <= currentFriday.getTime()) return "This work week";
    if (time >= currentSaturday.getTime() && time <= currentSunday.getTime()) return "This weekend";

    return "Later";
};

export function GatherHomeLayout({
    activeCategory,
    setActiveCategory,
    featuredQuery,
    upcomingQuery,
    tomorrowQuery,
    laterQuery,
    topPicks,
    upcomingEvents,
    CATEGORIES,
    selectedLanguages = ["en"],
    availableLanguages = ["en"],
    toggleLanguage = () => { },
}: any) {
    const [drawerType, setDrawerType] = useState<DrawerType>(null);
    const { user, loginWithGoogle, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans selection:bg-orange-100">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">J</div>
                        Joiner.
                    </div>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold">
                                <Sparkles className="w-3.5 h-3.5" />
                                Personalised
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold">
                                <Globe className="w-3.5 h-3.5" />
                                Public
                            </div>
                        )}
                        {/* {user ? (
                            <div className="flex items-center gap-2 border border-gray-200 rounded-full pr-4 pl-1 py-1 hover:bg-gray-50 transition-colors cursor-pointer" onClick={logout}>
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{user.displayName?.split(" ")[0]}</span>
                            </div>
                        ) : (
                            <Button variant="default" className="rounded-full bg-gray-900 border border-gray-900 text-white hover:bg-gray-800" onClick={loginWithGoogle}>
                                Login
                            </Button>
                        )} */}
                    </div>
                </div>
            </header>

            <main className="pt-6 space-y-10">
                {/* Categories */}
                <div className="px-0">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max items-center space-x-3 px-6 pb-2">
                            {/* Languages Dropdown */}
                            {availableLanguages.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedLanguages.filter((l: string) => availableLanguages.includes(l)).length > 0 ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"}`}>
                                            <Globe className={`w-3.5 h-3.5 ${selectedLanguages.filter((l: string) => availableLanguages.includes(l)).length > 0 ? "text-orange-500" : ""}`} />
                                            Language {(() => {
                                                const count = selectedLanguages.filter((l: string) => availableLanguages.includes(l)).length;
                                                return count > 0 ? `(${count})` : "";
                                            })()}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-48 ml-4 z-[100]" align="start">
                                        <DropdownMenuLabel>Filter by Language</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {availableLanguages.map((lang: string) => (
                                            <DropdownMenuCheckboxItem
                                                key={lang}
                                                checked={selectedLanguages.includes(lang)}
                                                onCheckedChange={() => toggleLanguage(lang)}
                                                className="uppercase"
                                            >
                                                {lang}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {CATEGORIES.map((cat: any) => (
                                <button
                                    key={cat.name}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
                    ${activeCategory === cat.name
                                            ? "bg-gray-900 text-white shadow-md scale-105"
                                            : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                                        }
                  `}
                                >
                                    {cat.icon && <cat.icon className={`w-3.5 h-3.5 ${activeCategory === cat.name ? "text-orange-400" : ""}`} />}
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
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Editors Choice 🔥</h2>
                    </div>

                    {featuredQuery.error && (
                        <div className="px-6 py-4 rounded-2xl bg-red-50 text-red-600 text-sm border border-red-100">
                            {typeof featuredQuery.error.message === "string" && featuredQuery.error.message.length > 500
                                ? featuredQuery.error.message.slice(0, 500) + "…"
                                : featuredQuery.error.message}
                        </div>
                    )}
                    {featuredQuery.isLoading ? (
                        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-4 flex gap-4">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="w-[340px] h-[400px] rounded-3xl shrink-0 bg-gray-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-4 flex gap-4">
                            {topPicks.length > 0 ? (
                                topPicks.map((event: any) => (
                                    <Link key={event.id} href={`/event/${encodeEventId(event.id)}`}>
                                        <div className="relative w-[340px] h-[400px] shrink-0 rounded-[2rem] overflow-hidden snap-center group cursor-pointer shadow-sm hover:shadow-md transition-shadow bg-black">
                                            {/* Full Height Background Image */}
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            {/* Top badges */}
                                            <div className="absolute top-4 right-4 flex gap-2 z-10">
                                                <button className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm hover:scale-105 transition-transform" onClick={(e) => {
                                                    e.preventDefault();
                                                    setDrawerType("like");
                                                }}>
                                                    <Heart className="w-4 h-4 fill-white text-white" />
                                                </button>
                                            </div>
                                            <Badge className="absolute top-4 left-4 bg-orange-500 hover:bg-orange-600 text-white border-0 px-3 py-1 text-xs uppercase tracking-wider font-bold shadow-sm z-10">
                                                Top Pick
                                            </Badge>

                                            {/* Bottom gradient content area */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 p-4 flex flex-col gap-2">
                                                <h2 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                                                    {event.title}
                                                </h2>

                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex -space-x-2 cursor-pointer hover:scale-105 transition-transform" onClick={(e) => {
                                                        e.preventDefault();
                                                        setDrawerType("people");
                                                    }}>
                                                        {(event.participants || []).slice(0, 3).map((p: any, i: number) => (
                                                            <div key={i} className="w-7 h-7 rounded-full border border-white/40 bg-white/20 overflow-hidden">
                                                                <img src={p.avatar} alt="User" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                        <div className="w-7 h-7 rounded-full border border-white/40 bg-black/40 overflow-hidden flex items-center justify-center">
                                                            <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                                                +{event.attendees || 0}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium bg-black/30 px-2.5 py-1.5 rounded-full border border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span className="truncate">{event.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="px-6 text-gray-500 text-sm">No featured events</p>
                            )}
                        </div>
                    )}
                </section>

                {/* Upcoming List */}
                <section className="px-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Upcoming Events</h2>
                        <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Timeline Tabs Removed */}

                    {upcomingQuery.isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-2xl bg-gray-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="relative pl-6">
                            {/* Vertical Line */}
                            <div className="absolute top-2 bottom-0 left-[11px] w-[2px] bg-gray-200"></div>

                            {upcomingEvents.length > 0 ? (
                                (() => {
                                    let currentGroup = "";
                                    return upcomingEvents.map((event: any) => {
                                        const group = event.apiGroup
                                            ? event.apiGroup.charAt(0).toUpperCase() + event.apiGroup.slice(1).replace('_', ' ')
                                            : getEventGroup(event.rawDate);
                                        const showHeader = group !== currentGroup;
                                        if (showHeader) currentGroup = group;

                                        return (
                                            <div key={event.id} className="relative mb-4">
                                                {showHeader && (
                                                    <div className="relative flex items-center mb-3 mt-6">
                                                        <div className="absolute -left-[20px] w-3.5 h-3.5 rounded-full bg-orange-500 ring-4 ring-gray-50 z-10 shadow-sm"></div>
                                                        <span className="text-[12px] font-black text-gray-900 uppercase tracking-widest bg-gray-50 pr-4">{group}</span>
                                                    </div>
                                                )}
                                                {!showHeader && (
                                                    <div className="absolute -left-[17px] top-6 w-1.5 h-1.5 rounded-full bg-gray-300 z-10"></div>
                                                )}
                                                <Link href={`/event/${encodeEventId(event.id)}`}>
                                                    <div className="bg-white rounded-3xl p-3 flex gap-4 hover:shadow-md border border-gray-100 transition-all cursor-pointer group">
                                                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100/50">
                                                            <img
                                                                src={event.image}
                                                                alt={event.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        </div>

                                                        <div className="flex-1 flex flex-col justify-center py-1 overflow-hidden">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">
                                                                    {event.category || "Event"}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-bold text-[17px] leading-tight text-gray-900 truncate">
                                                                {event.title}
                                                            </h3>

                                                            <div className="flex flex-col gap-1 mt-2">
                                                                <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="truncate">{event.date}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                                    <span className="truncate">{event.location}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <p className="text-gray-500 text-sm">No upcoming events</p>
                            )}

                            {upcomingQuery.hasNextPage && (
                                <button
                                    onClick={() => upcomingQuery.fetchNextPage()}
                                    disabled={upcomingQuery.isFetchingNextPage}
                                    className="w-full h-12 mt-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-600 transition-colors"
                                >
                                    {upcomingQuery.isFetchingNextPage ? "Loading Today..." : "More Today"}
                                </button>
                            )}

                            {tomorrowQuery?.hasNextPage && (
                                <button
                                    onClick={() => tomorrowQuery.fetchNextPage()}
                                    disabled={tomorrowQuery.isFetchingNextPage}
                                    className="w-full h-12 mt-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-600 transition-colors"
                                >
                                    {tomorrowQuery.isFetchingNextPage ? "Loading Tomorrow..." : "More Tomorrow"}
                                </button>
                            )}

                            {laterQuery?.hasNextPage && (
                                <button
                                    onClick={() => laterQuery.fetchNextPage()}
                                    disabled={laterQuery.isFetchingNextPage}
                                    className="w-full h-12 mt-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-600 transition-colors"
                                >
                                    {laterQuery.isFetchingNextPage ? "Loading Later..." : "More Later"}
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {/* App Download Drawer */}
            <AppDownloadDrawer
                isOpen={!!drawerType}
                type={drawerType}
                onClose={() => setDrawerType(null)}
            />

        </div>
    );
}
