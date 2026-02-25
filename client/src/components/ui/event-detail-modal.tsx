import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Heart, Share2, Info, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Event {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
  location: string;
  attendees?: number;
  spotsLeft?: number;
  description?: string;
  host?: {
    name: string;
    avatar: string;
  };
}

interface EventDetailModalProps {
  event: Event;
  children: React.ReactNode;
}



export function EventDetailModal({ event, children }: EventDetailModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Mock detailed description if not provided
  const description = event.description || "Join us for an amazing " + event.title + "! This is a perfect opportunity to meet new people and have a great time. We'll be focusing on creating a friendly and inclusive atmosphere for everyone.";

  const MAX_LENGTH = 150;
  const shouldTruncate = description.length > MAX_LENGTH;
  const displayedDescription = isExpanded || !shouldTruncate
    ? description
    : description.slice(0, MAX_LENGTH) + "...";

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[425px] h-[85vh] p-0 border-0 bg-background rounded-[2rem] flex flex-col overflow-hidden">
        <div className="relative h-64 shrink-0 w-full">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="icon" variant="secondary" className="rounded-full bg-white/10 backdrop-blur-md border-0 text-white hover:bg-white/20">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="rounded-full bg-white/10 backdrop-blur-md border-0 text-white hover:bg-white/20">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 -mt-6 relative z-10 bg-background rounded-t-[2rem]">
          <div className="space-y-6 pt-6">
            <div className="space-y-2">
              <Badge className="bg-primary/20 text-primary border-0 hover:bg-primary/30 font-semibold px-3">
                {event.category}
              </Badge>
              <h2 className="text-2xl font-bold font-display text-white">{event.title}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="p-2 rounded-xl bg-white/5">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Date</span>
                  <span className="text-white font-medium">{event.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="p-2 rounded-xl bg-white/5">
                  <MapPin className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Location</span>
                  <span className="text-white font-medium truncate">{event.location}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white/60 flex items-center gap-2">
                <Info className="w-4 h-4" /> About Event
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {displayedDescription}
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-1 text-primary cursor-pointer hover:underline font-medium"
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden bg-zinc-800">
                  <img src="https://i.pravatar.cc/100?img=12" alt="Host" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Hosted by</span>
                  <span className="text-white text-sm font-medium">Alex Rivers</span>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                Top Host
              </Badge>
            </div>

            <div className="flex gap-3">
              <Link href={`/event/${event.id}`}>
                <Button variant="outline" className="h-14 w-14 rounded-full border-white/20 hover:bg-white/10 p-0 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 rotate-45 transform" />
                </Button>
              </Link>
              <Button className="flex-1 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                Join Event
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
