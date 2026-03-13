import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Bell, Search, Filter, Calendar, MapPin, Heart, Sparkles, X, Globe, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AppDownloadDrawer, type DrawerType } from "@/components/ui/app-download-drawer";
import { encodeEventId } from "@/lib/idUtils";
import { useAuth } from "@/hooks/useAuth";
import { cn, getBroadLocation } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";

const getEventGroup = (rawDate: string) => {
    if (!rawDate) return "Later";
    const d = new Date(rawDate);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return "Today";

    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    const isTomorrow = d.toDateString() === tmrw.toDateString();
    if (isTomorrow) return "Tomorrow";

    return "Later";
};

export function GatherHomeLayout({
    activeCategory,
    setActiveCategory,
    featuredQuery,
    upcomingQuery,
    tomorrowQuery,
    laterQuery,
    topPicks = [],
    upcomingEvents = [],
    CATEGORIES = [],
    selectedLanguages = [],
    availableLanguages = [],
    toggleLanguage = () => { },
    selectedCountry = null,
    toggleCountry = () => { },
    countries = [],
    allCountriesCount = 0,
    geoCity = "Your Location",
    isLoginEnabled = true,
}: any) {
    const { user, loginWithGoogle, logout } = useAuth();
    const [drawerType, setDrawerType] = useState<DrawerType>(null);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans selection:bg-orange-100">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">J</div>
                        <span>Joiner.</span>
                        {(() => {
                            const current = countries.find((c: any) => c.id === selectedCountry);
                            if (!current) return null;
                            return (
                                <span className="ml-1 text-xs font-medium text-orange-600 tracking-normal" style={{ fontFamily: "'Architects Daughter', cursive" }}>
                                    now in {current.capitalName}! {current.flag}
                                </span>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Country Switcher */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold transition-all hover:opacity-80 cursor-pointer">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {selectedCountry ? countries.find((c: any) => c.id === selectedCountry)?.name : "Countries"}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 mt-1 z-[100]" align="end">
                                <DropdownMenuLabel>Event Location</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {countries.map((country: any) => (
                                    <DropdownMenuCheckboxItem
                                        key={country.id}
                                        checked={selectedCountry === country.id}
                                        onCheckedChange={() => toggleCountry(country.id)}
                                    >
                                        <span className="mr-2">{country.flag}</span>
                                        {country.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 cursor-pointer ${user ? "bg-orange-50 border border-orange-100 text-orange-600" : "bg-gray-100 border border-gray-200 text-gray-600"}`}>
                                    {user ? <Sparkles className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                                    {user ? "Personalised" : "Public"}
                                    {(() => {
                                        const count = selectedLanguages.filter((l: string) => availableLanguages.includes(l)).length;
                                        return count > 0 ? ` (${count})` : "";
                                    })()}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 mt-1 z-[100]" align="end">
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

                        {isLoginEnabled && (
                            user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="flex items-center gap-2 border border-gray-200 rounded-full pr-4 pl-1 py-1 hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                                                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">{user.displayName?.split(" ")[0]}</span>
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-48 mt-1 z-[100]" align="end">
                                        <DropdownMenuItem asChild className="cursor-pointer">
                                            <Link href="/profile">My Profile</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button variant="default" className="rounded-full bg-gray-900 border border-gray-900 text-white hover:bg-gray-800" onClick={loginWithGoogle}>
                                    Login
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </header >

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
                                    title={cat.name === "Personalised" ? geoCity : undefined}
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
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">{user ? "Special for you ✨" : "Editors Choice 🔥"}</h2>
                    </div>

                    {featuredQuery?.error && (
                        <div className="px-6 py-4 rounded-2xl bg-red-50 text-red-600 text-sm border border-red-100">
                            {typeof featuredQuery.error.message === "string" && featuredQuery.error.message.length > 500
                                ? featuredQuery.error.message.slice(0, 500) + "…"
                                : featuredQuery.error.message}
                        </div>
                    )}
                    {featuredQuery?.isLoading ? (
                        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-4 flex gap-4">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="w-[340px] h-[400px] rounded-3xl shrink-0 bg-gray-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory px-6 pb-4 flex gap-4">
                            {topPicks.length > 0 ? (
                                topPicks.map((event: any) => (
                                    <Link key={`${event.id}-${event.isFriendsGoing ? 'fg' : 'tp'}`} href={`/event/${encodeEventId(event.id)}`}>
                                        {event.isFriendsGoing ? (
                                            /* ===== Friends Going Card ===== */
                                            <div className="relative w-[340px] h-[400px] shrink-0 rounded-[2rem] overflow-hidden snap-center group cursor-pointer shadow-md hover:shadow-xl transition-all bg-black ring-2 ring-emerald-400/60">
                                                {/* Background image with stronger blur overlay */}
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                {/* Color tint & Ultra-smooth Readability Overlays */}
                                                <div className="absolute inset-0 bg-emerald-900/10 z-[1]"></div>
                                                <div 
                                                    className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-[1]"
                                                    style={{ backdropFilter: 'blur(8px)', maskImage: 'linear-gradient(to top, black 20%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 80%)' }}
                                                ></div>

                                                {/* "Your friend is going" badge */}
                                                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm border border-emerald-300/30 shadow-lg">
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-white">👋 Your friend is going</span>
                                                </div>

                                                {/* Floating friend avatars - the hero element */}
                                                <div className="absolute top-16 left-0 right-0 z-[5] flex justify-center items-center h-[160px]">
                                                    {(() => {
                                                        const friends = [...(event.participants || [])].sort((a, b) => {
                                                            if (a.isFollowing && !b.isFollowing) return -1;
                                                            if (!a.isFollowing && b.isFollowing) return 1;
                                                            return 0;
                                                        });
                                                        const friendsToShow = friends.filter(p => p.isFollowing).slice(0, 5);
                                                        if (friendsToShow.length === 0) {
                                                            // No following friends, show first 3
                                                            return friends.slice(0, 3).map((p: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-14 h-14 rounded-full border-2 border-white/60 overflow-hidden shadow-xl -ml-3 first:ml-0"
                                                                    style={{ animation: `float-avatar ${2 + i * 0.5}s ease-in-out infinite alternate` }}
                                                                >
                                                                    <img src={p.avatar} alt="Friend" className="w-full h-full object-cover" />
                                                                </div>
                                                            ));
                                                        }
                                                        return friendsToShow.map((p: any, i: number) => (
                                                            <div
                                                                key={i}
                                                                className="w-16 h-16 rounded-full border-[3px] border-emerald-400 overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.4)] -ml-4 first:ml-0 relative"
                                                                style={{
                                                                    animation: `float-avatar ${2 + i * 0.7}s ease-in-out infinite alternate`,
                                                                    zIndex: 10 - i,
                                                                }}
                                                            >
                                                                <img src={p.avatar} alt="Friend" className="w-full h-full object-cover" />
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>

                                                {/* Bottom content */}
                                                <div className="absolute bottom-0 left-0 right-0 z-[2] p-4 flex flex-col gap-2">
                                                    <h2 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                                                        {event.title}
                                                    </h2>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
                                                            {(() => {
                                                                const followingCount = (event.participants || []).filter((p: any) => p.isFollowing).length;
                                                                const totalCount = event.participantCount || event.attendees || 0;
                                                                if (followingCount > 0) {
                                                                    return <span>{followingCount} friend{followingCount > 1 ? 's' : ''} going · {totalCount} total</span>;
                                                                }
                                                                return <span>{totalCount} going</span>;
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium bg-black/30 px-2.5 py-1.5 rounded-full border border-white/10">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="truncate">{event.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* ===== Host-centric Card (you follow the host) ===== */
                                            <div className={`relative w-[340px] h-[400px] shrink-0 rounded-[2rem] overflow-hidden snap-center group cursor-pointer shadow-md hover:shadow-xl transition-all bg-black ring-2 ring-violet-400/60 ${event.isPromoted ? 'ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : ''}`}>
                                                {/* Background image - No blur, clear focus */}
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                {/* Color tint & Ultra-smooth Readability Overlays */}
                                                <div className="absolute inset-0 bg-violet-900/10 z-[1]"></div>
                                                <div 
                                                    className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-[1]"
                                                    style={{ backdropFilter: 'blur(8px)', maskImage: 'linear-gradient(to top, black 20%, transparent 80%)', WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 80%)' }}
                                                ></div>

                                                {/* Top-left: "You follow host!" badge */}
                                                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600/90 backdrop-blur-sm border border-violet-400/30 shadow-lg">
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-white">⭐ You follow host!</span>
                                                </div>

                                                {/* Heart button top-right */}
                                                <div className="absolute top-4 right-4 z-10">
                                                    <button className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm hover:scale-105 transition-transform" onClick={(e) => {
                                                        e.preventDefault();
                                                        setDrawerType("like");
                                                    }}>
                                                        <Heart className="w-4 h-4 fill-white text-white" />
                                                    </button>
                                                </div>

                                                {/* Bottom content area */}
                                                <div className="absolute bottom-0 left-0 right-0 z-[2] p-5 flex flex-col gap-2.5">
                                                    {/* Avatars Row: Host + Participants */}
                                                    <div className="flex items-center gap-3">
                                                        {event.host?.avatar && (
                                                            <div className="w-12 h-12 rounded-full border-2 border-violet-400 overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.5)] bg-black">
                                                                <img src={event.host.avatar} alt={event.host.name} className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="flex -space-x-2">
                                                            {(() => {
                                                                const hostAvatar = event.host?.avatar || '';
                                                                const sortedParticipants = [...(event.participants || [])]
                                                                    .filter((p) => p.avatar !== hostAvatar)
                                                                    .sort((a, b) => {
                                                                        if (a.isFollowing && !b.isFollowing) return -1;
                                                                        if (!a.isFollowing && b.isFollowing) return 1;
                                                                        return 0;
                                                                    });
                                                                const displayAvatars = sortedParticipants.slice(0, 3);
                                                                const extraCount = (event.participantCount || event.attendees || 0) - (event.host ? 1 : 0);

                                                                return (
                                                                    <>
                                                                        {displayAvatars.map((p: any, i: number) => (
                                                                            <div key={i} className={`w-7 h-7 rounded-full border border-white/40 ${p.isFollowing ? 'ring-2 ring-green-500 ring-offset-0' : ''} bg-white/20 overflow-hidden shadow-sm`}>
                                                                                <img src={p.avatar} alt="User" className="w-full h-full object-cover" />
                                                                            </div>
                                                                        ))}
                                                                        {(extraCount > displayAvatars.length) && (
                                                                            <div className="w-7 h-7 rounded-full border border-white/40 bg-black/60 overflow-hidden flex items-center justify-center shadow-sm">
                                                                                <span className="text-[9px] font-bold text-white">+{extraCount - displayAvatars.length}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Title & Info */}
                                                    <div className="space-y-1">
                                                        <h2 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                                                            {event.title}
                                                        </h2>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <div className="flex flex-col">
                                                                <span className="text-violet-300 text-[10px] font-bold uppercase tracking-wider">Hosted by {event.host?.name}</span>
                                                                <span className="text-white/60 text-[10px]">{event.participantCount || event.attendees || 0} participants</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                                                                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                                                                    <span className="truncate">{event.date}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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

                    {upcomingQuery?.isLoading ? (
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
                                        const getTranslatedGroup = (g: string) => {
                                            return g.charAt(0).toUpperCase() + g.slice(1).replace('_', ' ');
                                        };
                                        const group = event.apiGroup
                                            ? getTranslatedGroup(event.apiGroup)
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
                                                    <div className={`bg-white rounded-3xl p-3 flex gap-4 hover:shadow-md border transition-all cursor-pointer group ${event.isPromoted ? 'border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'border-gray-100'}`}>
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
                                                                    {event.category}
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
                                                                    <span className="truncate">
                                                                        {event.distance != null
                                                                            ? `${Math.round(event.distance)} km away`
                                                                            : (selectedCountry ? countries.find((c: any) => c.id === selectedCountry)?.name || "Portugal" : "Portugal")}
                                                                    </span>
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

                            {upcomingQuery?.hasNextPage && (
                                <button
                                    onClick={() => upcomingQuery.fetchNextPage()}
                                    disabled={upcomingQuery.isFetchingNextPage}
                                    className="w-full h-12 mt-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-600 transition-colors"
                                >
                                    {upcomingQuery.isFetchingNextPage ? "Loading More..." : "More Events"}
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

            {/* Floating Action Button for Creating Event */}
            {isLoginEnabled && (
                <Link href="/create-event">
                    <a className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-transform hover:scale-105 z-40">
                        <Plus className="w-7 h-7" />
                    </a>
                </Link>
            )}

            {/* App Download Drawer */}
            <AppDownloadDrawer
                isOpen={!!drawerType}
                type={drawerType}
                onClose={() => setDrawerType(null)}
            />

        </div >
    );
}
