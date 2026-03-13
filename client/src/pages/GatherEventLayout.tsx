import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
    Calendar, MapPin, Share2, Heart,
    ChevronLeft, Instagram, ArrowRight, Moon, X, Sparkles, Globe, Info
} from "lucide-react";
import { AppDownloadDrawer, type DrawerType } from "@/components/ui/app-download-drawer";
import { useAuth } from "@/hooks/useAuth";
import { cn, getBroadLocation } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ParticipantsDrawer } from "@/components/ui/participants-drawer";

// using getBroadLocation from lib/utils

function RegistrationCard({
    event, isFree, minPrice, currency, timeString, endTimeString,
    isAuth, participationStatus, handleJoin, isJoining, setDrawerType, isLoginEnabled
}: any) {
    const isApproved = participationStatus?.status === "approved";

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden p-1">
            <div className="p-5 space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Registration</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            {isFree ? "Free" : `${minPrice} ${currency}`} • Approval Required
                        </p>
                    </div>
                    <div className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        • {event.spotsLeft || 0} spots left
                    </div>
                </div>

                {/* Date/Location Box inside Reg Box */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-5 border border-gray-100/50">
                    <div className="flex gap-4">
                        <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{event.date}</span>
                            <span className="text-xs text-gray-500 font-medium mt-0.5">{timeString} {endTimeString ? `- ${endTimeString}` : ""}</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">
                                {isApproved ? ((event.raw?.place as string) || event.location) : "Exact Location Hidden"}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-0.5">
                                {isApproved
                                    ? (event.location !== "TBA" ? event.location : "")
                                    : getBroadLocation(event.location)}
                            </span>
                        </div>
                    </div>
                </div>

                {(!isLoginEnabled && isAuth) ? (
                    <div className="bg-gray-100 text-gray-400 font-bold p-3 text-center rounded-xl text-sm border border-gray-100">
                        Login is currently disabled
                    </div>
                ) : (
                    <Button
                        className="w-full h-12 rounded-xl bg-gray-900 text-white hover:bg-black font-bold text-base transition-colors group disabled:bg-gray-400 disabled:opacity-100"
                        onClick={() => {
                            if (!isAuth) {
                                setDrawerType("join");
                            } else if (!participationStatus) {
                                handleJoin();
                            }
                        }}
                        disabled={isJoining || !!participationStatus}
                    >
                        {!isAuth ? (
                            <>Request to Join <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></>
                        ) : (
                            isJoining ? "Joining..." :
                                !participationStatus ? "Join Event" :
                                    participationStatus.status === "pending" ? "Request Pending" :
                                        participationStatus.status === "approved" ? "Joined" :
                                            participationStatus.status === "invited" ? "Invited" :
                                                participationStatus.status === "canceled" ? "Canceled" :
                                                    participationStatus.status === "rejected" ? "Rejected" :
                                                        "Joined"
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

import { COUNTRIES } from "@/lib/countries";
import { useAffiliates } from "@/hooks/useAffiliates";
import { CreditCard, ExternalLink } from "lucide-react";

export function GatherEventLayout({
    event, month, day, timeString, endTimeString, participants: allParticipants = [], minPrice, currency,
    participationStatus, handleJoin, isJoining, isAuth,
    selectedLanguages = [], availableLanguages = [], toggleLanguage = () => { },
    selectedCountry = null, toggleCountry = () => { },
    countries = [], allCountriesCount = 0,
    isLoginEnabled = true
}: any) {
    const participants = allParticipants
        .filter((p: any) => p.status === "approved")
        .map((p: any) => ({
            ...p,
            id: p.client_id || p.id,
            photo: p.photo || p.avatar || p.image,
            name: p.name || "Participant"
        }));
    const { affiliates } = useAffiliates();

    const findAffiliateLinks = (text: string) => {
        if (!text || affiliates.length === 0) return [];
        const links: { name: string; url: string }[] = [];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let match;
        while ((match = urlRegex.exec(text)) !== null) {
            const url = match[0];
            const affiliate = affiliates.find(a => url.startsWith(a.urlStartsWith));
            if (affiliate) {
                links.push({ name: affiliate.name, url });
            }
        }
        return links;
    };

    const removeAffiliateLinks = (text: string, foundLinks: { url: string }[]) => {
        let cleanText = text;
        foundLinks.forEach(link => {
            cleanText = cleanText.replace(link.url, "");
        });
        return cleanText.trim();
    };

    const [drawerType, setDrawerType] = useState<DrawerType>(null);
    const [isHostAboutOpen, setIsHostAboutOpen] = useState(false);
    const { user, loginWithGoogle, logout } = useAuth();
    const isFree = minPrice === 0;
    const isApproved = participationStatus?.status === "approved";
    const displayLocation = isApproved
        ? ((event.raw?.place as string) || event.location)
        : getBroadLocation(event.location);

    const mapQuery = encodeURIComponent(displayLocation.trim());
    const mapZoom = isApproved ? 16 : 13;

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans pb-20 selection:bg-black/10">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-700">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
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
                            )
                        )}
                    </div>
                </div>
            </header>

            <main className="container max-w-6xl mx-auto px-6 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12 xl:gap-20">

                    {/* LEFT COLUMN */}
                    <div className="relative">
                        <div className="sticky top-24 space-y-10 self-start">
                            {/* Event Image Card */}
                            <div className="relative">
                                {/* Ambient Glow Background */}
                                <div className="absolute -inset-6 z-[-1] opacity-40 mix-blend-multiply">
                                    <img
                                        src={event.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000"}
                                        alt=""
                                        className="w-full h-full object-cover blur-3xl saturate-[2] transform scale-105"
                                        aria-hidden="true"
                                    />
                                </div>

                                <div className="relative aspect-[4/5] w-full rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 bg-gray-50 z-10">
                                    <img
                                        src={event.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000"}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Top Left Date Badge */}
                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 flex flex-col items-center justify-center shadow-sm z-30">
                                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{month}</span>
                                        <span className="text-xl font-black text-gray-900 leading-none mt-0.5">{day}</span>
                                    </div>

                                    {/* Top Right Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2 z-30">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 shadow-sm transition-transform hover:scale-105"
                                            onClick={() => setDrawerType("share")}
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 shadow-sm transition-transform hover:scale-105"
                                            onClick={() => setDrawerType("like")}
                                        >
                                            <Heart className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Bottom-aligned content for mobile (title + participants) */}
                                    <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent lg:hidden flex flex-col gap-3">
                                        {event.category && (
                                            <span className="w-fit px-2 py-0.5 bg-orange-500 text-white rounded text-[10px] font-black uppercase tracking-wider">
                                                {event.category}
                                            </span>
                                        )}
                                        <h1 className="text-3xl font-black text-white leading-tight drop-shadow-md">
                                            {event.title}
                                        </h1>

                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setDrawerType("people")}>
                                            <div className="flex -space-x-2">
                                                {participants.slice(0, 4).map((p: any, i: number) => (
                                                    <div key={p.id || i} className="w-8 h-8 rounded-full border-2 border-white/40 bg-white/20 overflow-hidden relative z-10">
                                                        {p.photo ? (
                                                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                                                                {p.name?.[0]?.toUpperCase() || "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {participants.length > 4 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white/40 bg-black/40 text-white flex items-center justify-center text-[10px] font-bold relative z-10">
                                                        +{participants.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                            {participants.length > 0 && (
                                                <span className="text-sm font-bold text-white drop-shadow-sm">
                                                    {participants.length} Going
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hosted By Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Hosted By</h3>

                                <div className="flex items-center gap-4 px-1">
                                    <Link href={`/client/${event.host?.id}`} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer group/host">
                                        <div className="h-12 w-12 rounded-full overflow-hidden bg-orange-200 shrink-0 border border-gray-100 transition-transform group-hover/host:scale-105">
                                            {event.host?.avatar ? (
                                                <img src={event.host.avatar} className="w-full h-full object-cover" alt={event.host.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-orange-800 font-bold">
                                                    {event.host?.name?.[0] || "?"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-base font-bold text-gray-900 truncate group-hover/host:text-orange-600 transition-colors">
                                                {event.host?.name || "Unknown Host"}
                                            </span>
                                            <span className="text-sm text-gray-500">Event Organizer</span>
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-violet-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                                            onClick={() => setIsHostAboutOpen(!isHostAboutOpen)}
                                        >
                                            <Info className="w-4 h-4" />
                                        </Button>
                                        {isLoginEnabled && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full h-8 text-xs font-semibold px-4 border-gray-200 text-gray-700 hover:bg-gray-50"
                                                onClick={() => setDrawerType("social")}
                                            >
                                                Follow
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <p className={cn(
                                    "text-sm text-gray-600 leading-relaxed px-1 transition-all duration-300 overflow-hidden",
                                    !isHostAboutOpen ? "max-h-0 opacity-0 lg:max-h-none lg:opacity-100" : "max-h-40 opacity-100"
                                )}>
                                    {(event.raw?.owner as any)?.about || "I'm ready to invite everybody, let's have some fun!"}
                                </p>
                            </div>

                            {/* Mobile-only Registration Box (displayed right under host) */}
                            <div className="lg:hidden mt-2">
                                <RegistrationCard
                                    event={event}
                                    isFree={isFree}
                                    minPrice={minPrice}
                                    currency={currency}
                                    timeString={timeString}
                                    endTimeString={endTimeString}
                                    isAuth={isAuth}
                                    participationStatus={participationStatus}
                                    handleJoin={handleJoin}
                                    isJoining={isJoining}
                                    setDrawerType={setDrawerType}
                                    isLoginEnabled={isLoginEnabled}
                                />
                            </div>



                            {/* Participants Section (Hidden on mobile as it's over the image) */}
                            <div className="hidden lg:block space-y-4 px-1">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Participants</h3>

                                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setDrawerType("people")}>
                                    <div className="flex -space-x-2">
                                        {participants.slice(0, 4).map((p: any, i: number) => (
                                            <div key={p.id || i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative z-10">
                                                {p.photo ? (
                                                    <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                        {p.name?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {participants.length > 4 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 text-gray-500 flex items-center justify-center text-[10px] font-bold relative z-10">
                                                +{participants.length - 4}
                                            </div>
                                        )}
                                        {participants.length === 0 && (
                                            <div className="text-sm text-gray-500 italic ml-2">Be the first to join!</div>
                                        )}
                                    </div>
                                    {participants.length > 0 && (
                                        <span className="text-sm font-semibold text-gray-700">
                                            {participants.length} Going
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-12">
                        {/* Title & Tags */}
                        <div className="space-y-4">
                            {event.category && (
                                <span className="hidden lg:inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                                    {event.category}
                                </span>
                            )}
                            <h1 className="hidden lg:block text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap gap-2">
                                {event.tags?.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Registration Box */}
                        <div className="hidden lg:block">
                            <RegistrationCard
                                event={event}
                                isFree={isFree}
                                minPrice={minPrice}
                                currency={currency}
                                timeString={timeString}
                                endTimeString={endTimeString}
                                isAuth={isAuth}
                                participationStatus={participationStatus}
                                handleJoin={handleJoin}
                                isJoining={isJoining}
                                setDrawerType={setDrawerType}
                            />
                        </div>

                        {/* About Event */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">About Event</h2>
                            </div>

                            {(() => {
                                const fullDesc = `${event.description || ""}\n${event.raw?.extra_description || ""}`;
                                const foundLinks = findAffiliateLinks(fullDesc);
                                if (foundLinks.length === 0) return null;

                                return (
                                    <div className="flex flex-col gap-3">
                                        {foundLinks.map((link, idx) => (
                                            <Button
                                                key={idx}
                                                className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                                                onClick={() => window.open(link.url, "_blank")}
                                            >
                                                <CreditCard className="w-6 h-6" />
                                                {link.name || "Pay Now"}
                                                <ExternalLink className="w-4 h-4 opacity-50" />
                                            </Button>
                                        ))}
                                    </div>
                                );
                            })()}

                            <div className="text-gray-600 leading-relaxed space-y-4 text-[15px]">
                                <p className="whitespace-pre-line">
                                    {(() => {
                                        const fullDesc = event.description || "";
                                        const foundLinks = findAffiliateLinks(fullDesc);
                                        return removeAffiliateLinks(fullDesc, foundLinks) || (event.description ? "" : "No description provided.");
                                    })()}
                                </p>
                                {event.raw?.extra_description && (
                                    <p className="whitespace-pre-line">
                                        {(() => {
                                            const extraDesc = event.raw.extra_description as string;
                                            const foundLinks = findAffiliateLinks(extraDesc);
                                            return removeAffiliateLinks(extraDesc, foundLinks);
                                        })()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">Location</h2>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden relative group">
                                <div className="aspect-[2/1] bg-gray-200 w-full relative">
                                    <iframe
                                        title="Event Location"
                                        width="100%"
                                        height="100%"
                                        className="w-full h-full border-0 grayscale opacity-90 contrast-125"
                                        loading="lazy"
                                        src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`}
                                    />
                                </div>

                                <div className="p-4 bg-white flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {isApproved ? ((event.raw?.place as string) || event.location) : "Exact Location Hidden"}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {isApproved ? event.location : getBroadLocation(event.location)}
                                        </p>
                                    </div>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:underline shrink-0">
                                        Get Directions
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="container max-w-6xl mx-auto px-6 mt-20 pt-8 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 font-medium">
                <div>Joiner. <span className="text-gray-400">© 2026</span></div>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-gray-900">Terms</a>
                    <a href="#" className="hover:text-gray-900">Privacy</a>
                    <a href="#" className="hover:text-gray-900">Support</a>
                </div>
            </footer>

            {isAuth && drawerType === "people" ? (
                <ParticipantsDrawer
                    isOpen={drawerType === "people"}
                    onClose={() => setDrawerType(null)}
                    participants={participants}
                />
            ) : (
                <AppDownloadDrawer
                    isOpen={!!drawerType}
                    type={drawerType}
                    onClose={() => setDrawerType(null)}
                    event={event.raw || event}
                />
            )}
        </div>
    );
}
