import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
    Calendar, MapPin, Share2, Heart,
    ChevronLeft, Globe, Instagram, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Tag, Users } from "lucide-react";

export function JoinerEventLayout({ event, month, day, timeString, endTimeString, participants, minPrice, currency }: any) {
    return (
        <div className="min-h-screen bg-[#111] text-white font-sans selection:bg-white/20 pb-20">
            {/* Top Navigation */}
            <div className="fixed top-0 left-0 right-0 z-50 p-6 pointer-events-none">
                <Link href="/">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70 pointer-events-auto shadow-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
            </div>

            <main className="container max-w-6xl mx-auto px-6 pt-24">
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 xl:gap-20">

                    {/* LEFT COLUMN - Sticky Image & Info */}
                    <div className="relative">
                        <div className="sticky top-24 space-y-8">
                            {/* Image with Glowing Shadow */}
                            <div className="relative group">
                                {/* The blurred glow effect */}
                                <div
                                    className="absolute inset-0 blur-2xl opacity-40 scale-95 translate-y-4 rounded-3xl"
                                    style={{
                                        backgroundImage: `url(${event.image})`,
                                        backgroundPosition: 'center',
                                        backgroundSize: 'cover',
                                    }}
                                />
                                {/* Main Image */}
                                <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />

                                    {/* Apple/Glassmorphism Calendar Icon */}
                                    <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] shrink-0 overflow-hidden">
                                        {/* Red top bar common in calendar icons */}
                                        <div className="absolute top-0 w-full h-5 bg-red-500/80 border-b border-red-500/50 flex flex-col items-center justify-center">
                                            <span className="text-[9px] uppercase font-bold text-white tracking-widest leading-none mt-0.5">{month}</span>
                                        </div>
                                        {/* Date number */}
                                        <div className="mt-5 flex items-center justify-center">
                                            <span className="text-2xl font-black text-white drop-shadow-md">{day}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons top right */}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 shadow-lg">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 shadow-lg">
                                            <Heart className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Presented By / Host Info */}
                            <div className="space-y-6 px-1">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-[#F5C546] flex items-center justify-center text-black font-bold text-xl shrink-0">
                                        {event.host?.name?.[0] || "H"}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-zinc-500 font-medium">Presented by</span>
                                        <div className="flex items-center gap-1 font-semibold text-white cursor-pointer hover:underline">
                                            {event.host?.name || "Unknown Organization"}
                                            <ChevronLeft className="w-3 h-3 rotate-180 text-zinc-500" />
                                        </div>
                                    </div>
                                    <Button variant="secondary" className="ml-auto rounded-full text-xs font-semibold h-8 bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5">
                                        Subscribe
                                    </Button>
                                </div>

                                <div className="text-sm text-zinc-400 leading-relaxed">
                                    {(event.raw?.owner as any)?.about || `${event.host?.name} is a community collective. Join us for regular events and meetups!`}
                                </div>

                                <div className="flex gap-4">
                                    {(event.raw?.owner as any)?.instagram?.username && (
                                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-transparent" onClick={() => window.open(`https://instagram.com/${(event.raw.owner as any).instagram.username}`, '_blank')}>
                                            <Instagram className="w-5 h-5" />
                                        </Button>
                                    )}
                                    {(event.raw?.owner as any)?.linkedin && (
                                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-transparent" onClick={() => window.open((event.raw.owner as any).linkedin, '_blank')}>
                                            <Globe className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>

                                {/* Participants Preview */}
                                {participants.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t border-white/10">
                                        <h4 className="text-sm font-medium text-zinc-500">Going ({participants.length})</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {participants.map((p: any) => (
                                                <div key={p.id} className="flex flex-col items-center gap-1">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow-md">
                                                        {p.photo ? (
                                                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 font-bold bg-zinc-900">
                                                                {p.name?.[0]?.toUpperCase() || "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-zinc-400 w-12 truncate text-center">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-zinc-500">Report Event</h4>
                                    <Badge variant="outline" className="rounded-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 font-normal py-1 px-3">
                                        # {event.category}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Scrollable Content */}
                    <div className="space-y-10 pb-20">
                        {/* Header Info */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                                <span>Featured in</span>
                                <span className="text-white">Lisbon</span>
                                <ChevronLeft className="w-3 h-3 rotate-180" />
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                                {event.title}
                            </h1>

                            <div className="space-y-6 pt-2">
                                {/* Date Block */}
                                <div className="flex gap-4 items-start">
                                    <div className="h-12 w-12 rounded-xl bg-zinc-800/50 border border-white/10 flex items-center justify-center shrink-0">
                                        <Calendar className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <div className="flex flex-col pt-1">
                                        <span className="text-lg font-medium text-white">{event.date}</span>
                                        <span className="text-base text-zinc-500">{timeString} {endTimeString ? `- ${endTimeString}` : ''}</span>
                                    </div>
                                </div>

                                {/* Location Block */}
                                <div className="flex gap-4 items-start">
                                    <div className="h-12 w-12 rounded-xl bg-zinc-800/50 border border-white/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <div className="flex flex-col pt-1">
                                        <span className="text-lg font-medium text-white">
                                            {(event.raw?.place as string) || "Register to See Address"}
                                        </span>
                                        <span className="text-base text-zinc-500">
                                            {event.location !== "TBA" ? event.location : "Location hidden"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Registration Card */}
                        <div className="rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden">
                            <div className="bg-white/5 px-6 py-3 border-b border-white/5">
                                <span className="text-sm font-medium text-zinc-400">Registration</span>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex gap-3 bg-zinc-800/50 p-4 rounded-xl border border-white/5">
                                    <div className="mt-0.5">
                                        <AlertCircle className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{event.spotsLeft} Spots Remaining</p>
                                        <p className="text-sm text-zinc-400">Hurry up and register before the event fills up!</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-zinc-300 font-medium">Welcome! To join the event, please register below.</p>

                                    <Button className="w-full h-12 rounded-xl bg-white text-black font-bold text-lg hover:bg-zinc-200 hover:scale-[1.01] transition-all shadow-xl">
                                        Register
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-zinc-400">About Event</h2>
                            <div className="prose prose-invert prose-p:text-zinc-300 prose-li:text-zinc-300 prose-headings:text-white max-w-none leading-relaxed">
                                <p className="whitespace-pre-line text-lg">
                                    {event.description || "No description provided."}
                                </p>
                                {event.raw?.extra_description && (
                                    <p className="whitespace-pre-line text-md mt-4 text-zinc-400">
                                        {event.raw.extra_description as string}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-800/30 p-4 rounded-xl border border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm font-medium">Participants</span>
                                </div>
                                <div className="text-white font-medium">
                                    {(event.raw?.taken_capacity as number) || 0} / {(event.raw?.max_clients as number) || "Unlimited"}
                                </div>
                            </div>
                            <div className="bg-zinc-800/30 p-4 rounded-xl border border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Tag className="w-4 h-4" />
                                    <span className="text-sm font-medium">Price</span>
                                </div>
                                <div className="text-white font-medium">
                                    {minPrice > 0 ? `${minPrice} ${currency}` : "Free"}
                                </div>
                            </div>
                        </div>

                        {/* Rules & Requirements Section */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-semibold text-zinc-300">Requirements</h3>
                            <div className="flex flex-wrap gap-2">
                                {event.raw?.min_age && (
                                    <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300">
                                        Age: {event.raw.min_age as number}+ {event.raw.max_age ? `to ${event.raw.max_age as number}` : ''}
                                    </Badge>
                                )}
                                {event.raw?.gender && (
                                    <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300">
                                        Gender: {event.raw.gender as string}
                                    </Badge>
                                )}
                                {event.raw?.covid_pass && (
                                    <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Covid Pass Required
                                    </Badge>
                                )}
                                {event.raw?.languages && Array.isArray(event.raw.languages) && (
                                    <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300">
                                        Languages: {(event.raw.languages as string[]).join(", ")}
                                    </Badge>
                                )}
                            </div>
                        </div>



                        {/* Instructions */}
                        {event.raw?.instructions && (
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mt-6">
                                <h3 className="text-lg font-semibold text-primary mb-2">Instructions</h3>
                                <p className="text-primary/80 text-sm whitespace-pre-line leading-relaxed">
                                    {event.raw.instructions as string}
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}
