import { Button } from "@/components/ui/button";
import { X, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { generateEventDeepLink } from "@/lib/branch";
import { QRCodeSVG } from "qrcode.react";
import { getStoredUTMs } from "@/lib/utm";

export type DrawerType = "like" | "people" | "join" | "social" | "share" | null;

interface AppDownloadDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    type: DrawerType;
    event?: any;
}

export function AppDownloadDrawer({ isOpen, onClose, type, event }: AppDownloadDrawerProps) {
    const [copied, setCopied] = useState(false);
    const [deepLink, setDeepLink] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
            setDeepLink(null);
            return;
        }

        if (event) {
            generateEventDeepLink(event)
                .then(link => {
                    if (link) setDeepLink(link);
                })
                .catch(err => console.error("Failed to generate branch deep link", err));
        }
    }, [isOpen, event]);

    const getFallbackLink = () => {
        const base = "https://getjoiner.com/download";
        const utms = getStoredUTMs();
        const params = new URLSearchParams();
        Object.entries(utms).forEach(([key, val]) => {
            if (val) params.set(key, val);
        });
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    };

    const displayLink = deepLink || getFallbackLink();

    if (!isOpen || !type) return null;

    const isLike = type === "like";
    const isJoin = type === "join";
    const isSocial = type === "social";
    const isShare = type === "share";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(displayLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const title = isLike
        ? "Likes are better in the app!"
        : isJoin
            ? "Join events via the Joiner App"
            : isSocial
                ? "Social interactions are in the app!"
                : isShare
                    ? "Share this event"
                    : "See who's going in the app!";

    const subtitle = isLike
        ? "Currently, likes and other social actions can only be done through the Joiner app."
        : isJoin
            ? "To request to join this and many other amazing events, download the free Joiner app. It's fast, social, and packed with the best local crowd."
            : isSocial
                ? "Connect with hosts, follow their profiles, and stay updated on their latest events directly through the Joiner app."
                : isShare
                    ? "Spread the word! Invite your friends to join this event by sharing the link below."
                    : "Currently, you can only see the full list of attendees and connect with them through the Joiner app.";

    const motivationText = isLike
        ? "The host will be very happy to receive your like! It also helps us understand what you enjoy so we can recommend the best events. Download the app—it's free!"
        : isSocial
            ? "Following and social features are much better in the app! Stay connected with your favorite hosts and never miss their upcoming events."
            : "Networking and making friends is the best part of events! Download the app to check out profiles of attendees, connect, and chat. It's completely free!";

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px] cursor-pointer"
                onClick={onClose}
            />
            <div className="relative w-[75%] sm:w-full max-w-md h-full bg-white shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10 animate-in slide-in-from-right duration-300 overflow-y-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 rounded-full bg-gray-50 hover:bg-gray-100"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </Button>

                <div className="w-20 h-20 bg-black text-white rounded-[24px] flex items-center justify-center font-bold text-4xl mb-8 shadow-xl shadow-black/10">J</div>

                <h2 className="text-2xl font-black text-gray-900 text-center mb-4 tracking-tight leading-tight">
                    {title}
                </h2>
                <p className="text-gray-500 text-center mb-8 leading-relaxed font-medium">
                    {subtitle}
                </p>

                {isShare && (
                    <div className="w-full space-y-4 mb-8">
                        <div className="relative group">
                            <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pr-12 text-sm text-gray-600 font-medium truncate shadow-inner">
                                {displayLink}
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                onClick={handleCopyLink}
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                            {copied ? "Link Copied!" : "Click to Copy Link"}
                        </p>
                    </div>
                )}

                <div className="hidden md:flex bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner flex-col items-center mb-8 relative">
                    <QRCodeSVG
                        value={displayLink}
                        size={160}
                        bgColor="#f9fafb"
                        fgColor="#000000"
                        className="mix-blend-multiply"
                        level="Q"
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">Scan Code to Download</p>
                </div>

                <div className="md:hidden w-full flex flex-col items-center mb-8">
                    <a href={displayLink} className="w-full">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold text-lg h-14 shadow-lg shadow-orange-600/20">
                            Open in Joiner
                        </Button>
                    </a>
                </div>

                {!isJoin ? (
                    <p className="text-sm text-gray-600 font-medium text-center px-4 leading-relaxed bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 text-orange-900 font-bold shadow-sm">
                        {motivationText}
                    </p>
                ) : (
                    <div className="flex gap-4 opacity-90 hover:opacity-100 transition-opacity">
                        <a href="#" className="hover:-translate-y-1 transition-transform">
                            <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-10" />
                        </a>
                        <a href="#" className="hover:-translate-y-1 transition-transform">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-[43px] ml-1" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
