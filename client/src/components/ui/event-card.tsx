import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EventDetailModal } from "./event-detail-modal";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    image: string;
    category: string;
    date: string;
    location: string;
    spotsLeft: number;
    tags: string[];
  };
  index: number;
}

export function EventCard({ event, index }: EventCardProps) {
  return (
    <EventDetailModal event={event}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="glass-card rounded-[1.5rem] p-3 flex gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
        data-testid={`event-card-${event.id}`}
      >
        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                {event.category}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {event.spotsLeft} spots left
              </span>
            </div>
            <h3 className="font-bold text-lg leading-tight mt-1 line-clamp-1 text-white">
              {event.title}
            </h3>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {event.date}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </div>
          </div>
        </div>
      </motion.div>
    </EventDetailModal>
  );
}
