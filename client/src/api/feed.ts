import type { FeedEvent, RawApiEvent, AllFeedResponse } from "@/types/events";
import { getCategoryName } from "@/lib/categories";

const DEFAULT_IMAGE = "/assets/party.png";

function formatDate(value: string | undefined): string {
  if (!value) return "TBD";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-US', {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}


function getEventImage(raw: RawApiEvent): string {
  let img = DEFAULT_IMAGE;
  const media = raw.media;
  if (Array.isArray(media) && media.length > 0) {
    const first = media[0] as { url?: string; link?: string; original_url?: string; name?: string };
    if (first?.original_url) img = first.original_url;
    else if (first?.url) img = first.url;
    else if (first?.link) img = first.link;
    else if (first?.name && (first.name.startsWith("http") || first.name.startsWith("staging/"))) img = first.name;
  } else if (raw.photo) {
    img = raw.photo;
  } else if (raw.image) {
    img = raw.image;
  }

  if (img.startsWith("staging/")) {
    return `http://res.cloudinary.com/doyd6b6cf/image/upload/f_auto,q_auto/${img}`;
  }
  return img;
}

/** Map one raw API event to our FeedEvent shape (backend all-feed format) */
export function mapApiEventToFeedEvent(raw: RawApiEvent, index: number): FeedEvent {
  const id = raw.id != null ? String(raw.id) : `event-${index}`;
  const title = raw.name ?? raw.title ?? "Untitled Event";
  const image = getEventImage(raw);
  let category = "Event";
  if (typeof raw.category === 'string' && raw.category.trim() !== '' && raw.category !== 'Event') {
    category = raw.category;
  } else if (raw.category && typeof raw.category === 'object') {
    category = (raw.category as any).name || (raw.category as any).title || getCategoryName(raw.category_id);
  } else {
    category = getCategoryName(raw.category_id ?? (raw as any).categoryId);
  }
  const date = formatDate(raw.start_at ?? raw.date);
  let location = "TBA";
  const rawLoc = raw.location;
  if (rawLoc) {
    if (typeof rawLoc === "object") {
      const loc = rawLoc as any;
      const candidates = [
        loc.district, loc.street, loc.neighborhood, loc.locality,
        loc.sub_locality, loc.address, loc.formatted_address,
        loc.name, loc.city, loc.place
      ];
      location = candidates.find(c => c && typeof c === "string" && c !== "TBA") || "TBA";
    } else if (typeof rawLoc === "string" && rawLoc.trim() !== "" && rawLoc !== "TBA") {
      location = rawLoc;
    }
  }

  if (location === "TBA" || !location) {
    const candidates = [raw.place, raw.address, raw.city, raw.location_name, raw.place_id];
    location = candidates.find(c => c && typeof c === "string" && c !== "TBA") || "TBA";
  }

  if (location === "TBA" && raw.venue) {
    const venue = raw.venue as any;
    location = typeof venue === "string" ? venue : venue.name || venue.address || "TBA";
  }
  const attendees = raw.taken_capacity ?? raw.max_clients ?? 0;
  const spotsLeft = raw.remaining_capacity ?? 0;
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const description = raw.description ?? undefined;
  const owner = raw.owner;
  const host =
    owner && (owner.id != null || owner.name != null || owner.photo != null)
      ? {
        id: owner.id != null ? String(owner.id) : undefined,
        name: owner.name ?? "Host",
        avatar: owner.photo ?? "",
      }
      : undefined;

  const mappedParticipants = Array.isArray(raw.participants)
    ? raw.participants
      .map((p) => ({
        id: p?.client_id != null ? String(p.client_id) : undefined,
        name: p?.name ?? "Participant",
        avatar: p?.photo ?? p?.avatar ?? p?.image ?? "",
        photo: p?.photo ?? p?.avatar ?? p?.image ?? "",
        isFollowing: p?.is_following === true || p?.is_following === 1,
        status: p?.status
      }))
      .filter((p) => p.id !== undefined)
    : undefined;

  // participantCount: use the actual participants array length, or fall back to taken_capacity
  const participantCount = Array.isArray(raw.participants) && raw.participants.length > 0
    ? raw.participants.length
    : Number(attendees);

  return {
    id,
    title,
    image,
    category,
    date,
    rawDate: raw.start_at ?? raw.date ?? "",
    location,
    attendees: Number(attendees),
    spotsLeft: Number(spotsLeft),
    tags,
    ...(description && { description }),
    ...(host && { host }),
    ...(mappedParticipants && mappedParticipants.length > 0 && { participants: mappedParticipants }),
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    ...(raw.distance != null && { distance: Number(raw.distance) }),
    isPromoted: raw.is_promoted === true,
    participantCount,
  };
}

/** Get array of events from API response (handles array or { events } / { data }) */
function getEventsArray(data: AllFeedResponse): RawApiEvent[] {
  if (Array.isArray(data)) return data;
  const obj = data as { events?: RawApiEvent[]; data?: RawApiEvent[] };
  const list = obj.events ?? obj.data;
  return Array.isArray(list) ? list : [];
}

export function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
