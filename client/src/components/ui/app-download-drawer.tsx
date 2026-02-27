import { Button } from "@/components/ui/button";
import { X, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { eventDetails } from "@/api/eventDetailsClient";
import { QRCodeSVG } from "qrcode.react";

export type DrawerType = "like" | "people" | "join" | "social" | "share" | null;

interface AppDownloadDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    type: DrawerType;
    eventId?: string | number;
}

export function AppDownloadDrawer({ isOpen, onClose, type, eventId }: AppDownloadDrawerProps) {
    const [copied, setCopied] = useState(false);
    const [deepLink, setDeepLink] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
            setDeepLink(null);
            return;
        }

        if (eventId) {
            eventDetails.getDeepLink(eventId)
                .then(link => setDeepLink(link))
                .catch(err => console.error("Failed to fetch deep link", err));
        }
    }, [isOpen, eventId]);

    const displayLink = deepLink || "https://getjoiner.com/download";

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
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col items-center justify-center p-10 animate-in slide-in-from-right duration-300">
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

                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner flex flex-col items-center mb-8 relative">
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
