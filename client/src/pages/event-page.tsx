import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { eventDetails } from "@/api/eventDetailsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import { GatherEventLayout } from "./GatherEventLayout";
import { decodeEventId } from "@/lib/idUtils";

export default function EventPage() {
    const { user, loading: authLoading } = useAuth();
    const isAuth = !!user;

    const [, params] = useRoute("/event/:id");
    const rawId = params?.id;
    const id = rawId ? decodeEventId(rawId) : undefined;

    const { data: event, isLoading: eventLoading, error } = useQuery({
        queryKey: ["event", id, isAuth],
        queryFn: () => id ? eventDetails.getEventDetails(id, isAuth) : Promise.reject("No ID"),
        enabled: !!id && !authLoading,
    });

    const { data: participationStatus, refetch: refetchParticipationStatus } = useQuery({
        queryKey: ["participation-status", id, isAuth],
        queryFn: () => id ? eventDetails.getParticipationStatus(id) : Promise.resolve(null),
        enabled: !!id && isAuth && !authLoading,
    });

    const [isJoining, setIsJoining] = useState(false);

    const handleJoin = async () => {
        if (!id || !isAuth) return;
        try {
            setIsJoining(true);
            await eventDetails.joinEvent(id);
            await refetchParticipationStatus();
        } catch (e) {
            console.error("Failed to join event", e);
            // TODO: toast error or show message
        } finally {
            setIsJoining(false);
        }
    };

    if (authLoading || eventLoading) {
        return (
            <div className="min-h-screen bg-[#111] text-foreground p-8 flex justify-center">
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[380px_1fr] gap-12">
                    <Skeleton className="w-full aspect-square rounded-2xl" />
                    <div className="space-y-6">
                        <Skeleton className="w-3/4 h-12" />
                        <Skeleton className="w-1/2 h-6" />
                        <Skeleton className="w-full h-64" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                    <Info className="w-8 h-8 text-zinc-500" />
                </div>
                <h1 className="text-xl font-medium mb-2">Event not found</h1>
                <p className="text-zinc-500 mb-8 max-w-xs">We couldn't find the event you're looking for.</p>
                <Link href="/">
                    <Button variant="outline" className="rounded-full border-zinc-700 text-white hover:bg-zinc-800 hover:text-white">
                        Back to Feed
                    </Button>
                </Link>
            </div>
        );
    }

    const startAt = event.raw?.start_at ? new Date(event.raw.start_at) : null;
    const endAt = event.raw?.end_at ? new Date(event.raw.end_at) : null;
    const timeString = startAt ? startAt.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
    const endTimeString = endAt ? endAt.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
    const month = startAt ? startAt.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
    const day = startAt ? startAt.getDate() : '--';

    // Participants
    const participants = Array.isArray(event.raw?.participants) ? event.raw.participants : [];

    // Prices
    const prices = Array.isArray(event.raw?.prices) ? (event.raw.prices as any[]) : [];
    const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
    const currency = (event.raw?.currency as string) || "EUR";

    const commonProps = {
        event, month, day, timeString, endTimeString, participants, minPrice, currency,
        participationStatus, handleJoin, isJoining, isAuth
    };

    return (
        <GatherEventLayout {...commonProps} />
    );
}
