import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { ChevronLeft, Info, Activity, MapPin, Calendar, Loader2, Star, UserCheck, ShieldCheck, Instagram, Linkedin, MessageCircle, UserPlus, Zap } from "lucide-react";
import { serviceFeed } from "@/api/serviceFeedClient";
import { EventCard } from "@/components/ui/event-card";
import { FeedEvent } from "@/types/events";
import { Button } from "@/components/ui/button";

export default function ClientPage() {
    const [, params] = useRoute("/client/:id");
    const clientId = params?.id;

    const { data: config } = useQuery({
        queryKey: ["admin-config"],
        queryFn: () => fetch("/api/admin/analytics-config").then(r => r.json()),
    });

    const isLoginEnabled = config?.is_login_enabled !== false;

    const { data: client, isLoading: isClientLoading, error: clientError } = useQuery({
        queryKey: ["client-details", clientId],
        queryFn: () => clientId ? serviceFeed.getClientDetails(clientId) : Promise.reject("No ID"),
        enabled: !!clientId
    });

    const { data: upcomingData, isLoading: isEventsLoading } = useQuery({
        queryKey: ["client-upcoming-events", clientId],
        queryFn: () => clientId ? serviceFeed.getClientUpcomingEvents(clientId) : Promise.reject("No ID"),
        enabled: !!clientId
    });

    if (isClientLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
                <div className="h-6 w-48 bg-white/10 animate-pulse rounded"></div>
            </div>
        );
    }

    if (clientError || !client) {
        return (
            <div className="min-h-screen bg-black p-6 flex flex-col items-center justify-center text-center">
                <p className="text-red-400 mb-4">Sorry, we couldn't load this profile.</p>
                <Link href="/">
                    <Button className="rounded-full bg-white/10 text-white hover:bg-white/20">Go Back</Button>
                </Link>
            </div>
        );
    }

    const userData = client;

    return (
        <div className="min-h-screen bg-black font-sans pb-20 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Link href="/">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                    </Link>
                    <h1 className="text-xl font-bold text-white tracking-tight">@{userData.username || "profile"}</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
                {/* Profile Hero Card */}
                <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-orange-600/10 opacity-50" />
                    
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-violet-500/20 shadow-2xl">
                                <img
                                    src={userData.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`}
                                    alt={userData.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {userData.is_verified && (
                                <div className="absolute bottom-1 right-1 bg-violet-600 p-1.5 rounded-full border-2 border-black">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-2">
                            <h2 className="text-4xl font-black text-white leading-tight flex items-center justify-center gap-2">
                                {userData.name}
                                {(userData.is_influencer || userData.type === "influencer") && <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />}
                            </h2>
                            {userData.badge && (
                                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase tracking-widest">
                                    {userData.badge}
                                </div>
                            )}
                            <p className="text-white/40 font-medium text-lg mt-2">
                                {userData.status || "Exploring the world"}
                            </p>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-8 mt-8">
                            <div className="text-center">
                                <div className="text-2xl font-black text-white">{userData.followers || 0}</div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Followers</div>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="text-center">
                                <div className="text-2xl font-black text-white">{userData.followings || 0}</div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Following</div>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="text-center">
                                <div className="text-2xl font-black text-white">{userData.rating || "5.0"}</div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Rating</div>
                            </div>
                        </div>

                        {/* Social Actions */}
                        {isLoginEnabled && (
                            <div className="flex items-center gap-4 mt-8 w-full">
                                <Button className="flex-1 h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                    <UserPlus className="w-5 h-5 mr-2" /> Follow
                                </Button>
                                <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 p-0 text-white">
                                    <MessageCircle className="w-6 h-6" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10">
                        <div className="flex items-center gap-3 text-white/40 mb-2">
                            <Activity className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Experience</span>
                        </div>
                        <div className="text-xl font-black text-white">Level {userData.level || 0}</div>
                        <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-orange-500" 
                                style={{ width: `${(userData.experience / (userData.exp_to_next_level || 100)) * 100}%` }}
                            />
                        </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10">
                        <div className="flex items-center gap-3 text-white/40 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Location</span>
                        </div>
                        <div className="text-xl font-black text-white truncate">
                            {userData.location?.city || userData.country_code || "Global"}
                        </div>
                    </div>
                </div>

                {/* About Section */}
                {userData.about && (
                    <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group">
                        <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                            <Info className="w-5 h-5 text-violet-500" />
                            About
                        </h3>
                        <p className="text-white/60 leading-relaxed italic text-lg whitespace-pre-line">
                            "{userData.about}"
                        </p>
                        {userData.occupation && (
                            <div className="mt-6 flex items-center gap-2 text-white/40 text-sm font-medium">
                                <UserCheck className="w-4 h-4" />
                                {userData.occupation}
                            </div>
                        )}
                    </div>
                )}

                {/* Social Links */}
                {(userData.instagram?.username || userData.linkedin) && (
                    <div className="flex gap-4">
                        {userData.instagram?.username && (
                            <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                        <Instagram className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-bold text-white">Instagram</span>
                                </div>
                                <span className="text-white/40 text-sm">@{userData.instagram.username}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Upcoming Events Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-3 text-2xl font-black text-white">
                            <Calendar className="w-7 h-7 text-violet-500" />
                            Upcoming Events
                        </h3>
                        {upcomingData?.events && upcomingData.events.length > 0 && (
                            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/50">
                                {upcomingData.events.length} EVENTS
                            </span>
                        )}
                    </div>

                    {isEventsLoading ? (
                        <div className="grid gap-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-28 bg-white/5 animate-pulse rounded-[1.5rem] border border-white/5" />
                            ))}
                        </div>
                    ) : upcomingData?.events && upcomingData.events.length > 0 ? (
                        <div className="grid gap-4">
                            {upcomingData.events.map((event: FeedEvent, idx: number) => (
                                <EventCard key={event.id} event={event as any} index={idx} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 rounded-[2rem] p-12 border border-white/5 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-white/20" />
                            </div>
                            <h4 className="text-lg font-bold text-white">No public events scheduled</h4>
                            <p className="text-white/40 text-sm">Check back later to see what @{(userData.username || userData.name || "User").split(' ')[0]} is up to!</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="pt-8 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Member since {new Date(userData.created_at).getFullYear()}
                </div>
            </main>
        </div>
    );
}
