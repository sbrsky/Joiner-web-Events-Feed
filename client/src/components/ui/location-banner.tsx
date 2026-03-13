import { MapPin, X, Navigation } from "lucide-react";
import { Button } from "./button";
import { motion, AnimatePresence } from "framer-motion";

interface LocationBannerProps {
    isVisible: boolean;
    onEnable: () => void;
    onClose?: () => void;
    status: 'prompt' | 'denied' | 'granted' | 'unsupported';
}

export function LocationBanner({ isVisible, onEnable, onClose, status }: LocationBannerProps) {
    if (!isVisible || status === 'granted' || status === 'unsupported') return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white border-b border-orange-100"
                >
                    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="hidden sm:flex w-12 h-12 bg-orange-50 rounded-2xl items-center justify-center shrink-0">
                                <Navigation className="w-6 h-6 text-orange-600 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                                    <MapPin className="w-4 h-4 text-orange-600 sm:hidden" />
                                    Find events near you
                                </h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    {status === 'denied' 
                                        ? "Location access is blocked. Please enable it in your browser settings to see local events."
                                        : "Share your location to discover the best parties, meetups, and activities happening right where you are."}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {status === 'prompt' && (
                                <Button 
                                    onClick={onEnable}
                                    className="flex-1 sm:flex-initial h-10 rounded-xl bg-gray-900 border-none text-white hover:bg-black font-bold text-xs px-6 shadow-lg shadow-black/5"
                                >
                                    Enable Location
                                </Button>
                            )}
                            {onClose && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-10 w-10 text-gray-400 hover:text-gray-900 rounded-xl bg-gray-50 hover:bg-gray-100"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
