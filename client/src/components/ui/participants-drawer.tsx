import { Button } from "@/components/ui/button";
import { X, Users, MessageCircle, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface Participant {
    id: string | number;
    name: string;
    photo?: string;
    avatar?: string;
    isFollowing?: boolean;
}

interface ParticipantsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    participants: Participant[];
}

export function ParticipantsDrawer({ isOpen, onClose, participants }: ParticipantsDrawerProps) {
    const { data: config } = useQuery({
        queryKey: ["admin-config"],
        queryFn: () => fetch("/api/admin/analytics-config").then(r => r.json()),
    });

    const isLoginEnabled = config?.is_login_enabled !== false;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-start overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] cursor-pointer"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-[85%] sm:w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10"
            >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-xl">
                                        <Users className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Attendees</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                            {participants.length} People Going
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-gray-900 rounded-full bg-gray-50 hover:bg-gray-100"
                                    onClick={onClose}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto py-4">
                                {participants.length > 0 ? (
                                    <div className="px-4 space-y-2">
                                        {participants.map((person) => (
                                            <Link key={person.id} href={`/client/${person.id}`}>
                                                <div 
                                                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-100"
                                                >
                                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
                                                        {(person.photo || person.avatar) ? (
                                                            <img 
                                                                src={person.photo || person.avatar} 
                                                                alt={person.name} 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 uppercase">
                                                                {person.name?.[0] || "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-gray-900 truncate">{person.name}</h4>
                                                            {person.isFollowing && (
                                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">Following</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-medium truncate">New Member</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isLoginEnabled && (
                                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50">
                                                                <MessageCircle className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Users className="w-8 h-8 text-gray-200" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">No attendees yet</h3>
                                        <p className="text-sm text-gray-500 mt-1">Be the first one to join this event!</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {isLoginEnabled && (
                                <div className="p-6 bg-gray-50/50 border-t border-gray-100 mt-auto">
                                    <Button className="w-full h-12 rounded-xl bg-gray-900 text-white hover:bg-black font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                        <UserPlus className="w-4 h-4" />
                                        Invite Friends
                                    </Button>
                                </div>
                            )}
                        </motion.div>
        </div>
    );
}
