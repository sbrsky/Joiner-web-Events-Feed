import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
    Calendar, MapPin, Share2, Video,
    Users, Lightbulb, CheckCircle2, Copy
} from "lucide-react";

export function LumaEventLayout({ event, month, day, timeString, endTimeString, participants, minPrice, currency }: any) {
    const isFree = minPrice === 0;
    const mapQuery = encodeURIComponent(`${event.raw?.place || ""} ${event.location !== "TBA" ? event.location : ""}`.trim());

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans pb-10 selection:bg-blue-100">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-[#F9FAFB]/90 backdrop-blur-md border-b border-gray-200">
                <div className="container max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <Link href="/">
                            <div className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center font-bold text-xs mr-2 cursor-pointer hover:bg-gray-800 transition-colors">
                                L
                            </div>
                        </Link>
                        <span className="text-gray-900 font-semibold">Joiner Clone</span>
                        <span className="text-gray-300">/</span>
                        <span>Calendar</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 truncate max-w-[150px] sm:max-w-xs">{event.title}</span>
                    </div>
                    <div className="flex items-center gap-4 hidden sm:flex">
                        <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-100 h-8">
                            Sign In
                        </Button>
                        <Button className="bg-gray-900 text-white hover:bg-gray-800 h-8 text-xs font-semibold rounded-md px-4">
                            Get App
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container max-w-5xl mx-auto px-6 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 xl:gap-16 items-start">

                    {/* LEFT COLUMN - MAIN CONTENT */}
                    <div className="space-y-12">
                        {/* Event Title & Meta */}
                        <div className="space-y-4">
                            <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-gray-900 leading-[1.15]">
                                {event.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Video className="w-4 h-4" />
                                    <span>{event.location === "TBA" ? "TBA" : "In Person Event"}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    <span>{event.spotsLeft || participants.length} Attending</span>
                                </div>
                                {participants.length > 0 && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <div className="flex -space-x-1">
                                            {participants.slice(0, 3).map((p: any, i: number) => (
                                                <div key={p.id || i} className="w-5 h-5 rounded-full border border-white bg-gray-200 overflow-hidden">
                                                    {p.photo ? (
                                                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-600 bg-white">
                                                            {p.name?.[0]?.toUpperCase() || "?"}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Event Image */}
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                            <img
                                src={event.image || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000"}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />

                            {/* Bottom Left Date Badge */}
                            <div className="absolute bottom-4 left-4 bg-white rounded-xl px-4 py-2 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{month}</span>
                                <span className="text-2xl font-black text-gray-900 leading-none mt-1">{day}</span>
                            </div>
                        </div>

                        {/* Prerequisites callout */}
                        {event.raw?.instructions && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                                <div className="mt-0.5"><Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-100" /></div>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    <strong className="text-gray-900 font-semibold">Important:</strong> {event.raw.instructions}
                                </div>
                            </div>
                        )}

                        {/* About this event */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">About this event</h2>
                            <div className="text-gray-600 leading-relaxed space-y-4 text-[15px]">
                                <p className="whitespace-pre-line">
                                    {event.description || "No description provided."}
                                </p>
                                {event.raw?.extra_description && (
                                    <p className="whitespace-pre-line">
                                        {event.raw.extra_description as string}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">Location</h2>

                            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                                <div className="aspect-[2.5/1] w-full relative bg-gray-100">
                                    <iframe
                                        title="Event Location"
                                        width="100%"
                                        height="100%"
                                        className="w-full h-full border-0 grayscale opacity-90 contrast-125"
                                        loading="lazy"
                                        src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                    />
                                </div>

                                <div className="p-4 flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{(event.raw?.place as string) || "Location"}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{event.location}</p>
                                    </div>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 shrink-0">
                                        Get Directions <span className="rotate-45 block transform -translate-y-[1px]">↗</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN - SIDEBAR */}
                    <div className="relative self-start">
                        <div className="sticky top-24 space-y-6">

                            {/* Tickets / Registration Card */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tickets</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {isFree ? "Free" : `${minPrice} ${currency}`}
                                        </div>
                                    </div>
                                    <div className="bg-green-100 text-green-600 rounded-full p-1 border border-green-200">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Details Details */}
                                <div className="space-y-5">
                                    <div className="flex gap-4 items-start">
                                        <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{event.date}</span>
                                            <span className="text-sm text-gray-500 mt-0.5">
                                                {timeString} - {endTimeString || "TBD"}
                                            </span>
                                            <a href="#" className="text-xs text-blue-600 font-medium hover:underline mt-1">Add to Calendar</a>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {(event.raw?.place as string) || "Location hidden"}
                                            </span>
                                            <span className="text-sm text-gray-500 mt-0.5">
                                                {event.location !== "TBA" ? event.location : "Register to See Address"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors">
                                        Register for Event
                                    </Button>
                                    <p className="text-center text-xs text-gray-400 font-medium mt-3">
                                        {participants.length} people have registered so far.
                                    </p>
                                </div>
                            </div>

                            {/* Hosts Sidebar Variant */}
                            <div className="space-y-3 px-1">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Host</h4>
                                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                        {event.host?.avatar ? (
                                            <img src={event.host.avatar} className="w-full h-full object-cover" alt={event.host.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                                                {event.host?.name?.[0] || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">
                                            {event.host?.name || "Unknown Host"}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                            {(event.raw?.owner as any)?.about ? "Community Organizer" : "Event Host"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Share & Next */}
                            <div className="px-1 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">Share this event</span>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-200">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Up Next</h4>
                                    <div className="flex gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                            <span className="w-3 h-3 bg-gray-400 rounded-sm"></span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-gray-900 truncate">More Events Coming</span>
                                            <span className="text-xs text-gray-500">Stay tuned for updates</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="container max-w-5xl mx-auto px-6 mt-20 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 font-medium gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-900 text-white rounded-sm flex items-center justify-center font-bold text-[10px]">
                        L
                    </div>
                    <span className="text-gray-900 font-semibold">Joiner Clone</span>
                </div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-gray-900">Privacy</a>
                    <a href="#" className="hover:text-gray-900">Terms</a>
                    <a href="#" className="hover:text-gray-900">Twitter</a>
                </div>
                <div className="text-xs">© 2024 Joiner Clone Inc.</div>
            </footer>
        </div>
    );
}
