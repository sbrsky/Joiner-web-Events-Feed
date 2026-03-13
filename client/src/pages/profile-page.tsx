import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Link } from "wouter";
import { ChevronLeft, Info, Activity, MapPin, Calendar, Loader2 } from "lucide-react";
import { serviceFeed } from "@/api/serviceFeedClient";
import { EventCard } from "@/components/ui/event-card";
import { FeedEvent } from "@/types/events";

export default function ProfilePage() {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";

    const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
        queryKey: ["client-profile"],
        queryFn: async () => {
            const response = await fetchWithAuth(`${baseUrl}/api/proxied/api/client`, {
                method: "GET"
            });
            if (!response.ok) throw new Error("Failed to fetch profile");
            return response.json();
        }
    });

    const userData = profile?.data || profile;
    const clientId = userData?.id || userData?.uuid;

    const { data: upcomingData, isLoading: isEventsLoading } = useQuery({
        queryKey: ["client-upcoming-events", clientId],
        queryFn: () => serviceFeed.getClientUpcomingEvents(clientId),
        enabled: !!clientId
    });

    if (isProfileLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
                <div className="h-6 w-48 bg-white/10 animate-pulse rounded"></div>
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="min-h-screen bg-black p-6 flex flex-col items-center justify-center">
                <p className="text-red-400 mb-4 text-center">Sorry, we couldn't load your profile details.</p>
                <Link href="/">
                    <button className="px-6 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all">Go Back</button>
                </Link>
            </div>
        );
    }



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
                    <h1 className="text-xl font-bold text-white tracking-tight">Your Profile</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
                {/* Profile Card */}
                <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-orange-600/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-violet-500/20 shrink-0 relative z-10 shadow-2xl">
                        <img
                            src={userData?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.name}`}
                            alt={userData?.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-center sm:text-left flex-1 relative z-10">
                        <h2 className="text-4xl font-black text-white leading-tight">{userData?.name}</h2>
                        {userData?.email && <p className="text-white/40 font-medium text-lg mt-1">{userData.email}</p>}

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-5">
                            {userData?.level !== undefined && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-bold text-sm">
                                    <Activity className="w-4 h-4" />
                                    Level {userData.level}
                                </span>
                            )}
                            {userData?.country_name && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/10 text-white/70 font-bold text-sm border border-white/5">
                                    <MapPin className="w-4 h-4" />
                                    {userData.country_name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Events Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-3 text-2xl font-black text-white">
                            <Calendar className="w-7 h-7 text-violet-500" />
                            My Upcoming Events
                        </h3>
                        {upcomingData?.events && (
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
                            <div>
                                <h4 className="text-lg font-bold text-white">No upcoming events</h4>
                                <p className="text-white/40 text-sm mt-1">Join some events to see them here!</p>
                            </div>
                            <Link href="/">
                                <button className="mt-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all">
                                    Explore Events
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Info Display */}
                {(userData?.description || userData?.about) && (
                    <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 text-white/5 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Info className="w-24 h-24 rotate-12" />
                        </div>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6 relative z-10">
                            <Info className="w-5 h-5 text-violet-500" />
                            About Me
                        </h3>
                        <p className="text-white/60 leading-relaxed whitespace-pre-line text-lg relative z-10 italic">
                            "{userData.description || userData.about}"
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
