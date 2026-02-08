import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EventDetailModal } from "./event-detail-modal";

interface FeaturedCardProps {
  event: {
    id: string;
    title: string;
    image: string;
    category: string;
    date: string;
    attendees: number;
    location: string;
  };
}

export function FeaturedCard({ event }: FeaturedCardProps) {
  return (
    <EventDetailModal event={event}>
      <motion.div 
        className="relative min-w-[85vw] h-[65vh] rounded-[2rem] overflow-hidden snap-center group cursor-pointer"
        whileHover={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
        data-testid={`featured-event-${event.id}`}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <Badge className="bg-primary/90 hover:bg-primary text-white border-0 backdrop-blur-md px-3 py-1 text-xs uppercase tracking-wider font-semibold">
              Today's Top Pick
            </Badge>
            <button className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors">
              <Heart className="w-5 h-5 text-white" />
            </button>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight font-display mt-2">
            {event.title}
          </h2>

          <div className="flex items-center gap-4 text-white/80 text-sm mt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-secondary" />
              <span>{event.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">
                +{event.attendees}
              </div>
            </div>
            <span className="text-sm text-white/60">are going</span>
            
            <button className="ml-auto bg-white text-black font-bold px-6 py-2.5 rounded-full text-sm hover:scale-105 active:scale-95 transition-all">
              Join
            </button>
          </div>
        </div>
      </motion.div>
    </EventDetailModal>
  );
}
