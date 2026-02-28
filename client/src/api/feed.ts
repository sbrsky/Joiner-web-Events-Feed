import type { FeedEvent, RawApiEvent, AllFeedResponse } from "@/types/events";
import { api, type Event } from "./eventsClient";
import { getCategoryName } from "@/lib/categories";

const DEFAULT_IMAGE = "/assets/party.png";

function formatDate(value: string | undefined): string {
  if (!value) return "TBD";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
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

/** Map Event (eventsClient shape) to FeedEvent (UI cards) */
export function eventToFeedEvent(e: Event): FeedEvent {
  const spotsLeft =
    e.max_participants != null ? Math.max(0, e.max_participants - e.participants_count) : 0;
  return {
    id: String(e.id),
    title: e.title,
    image: e.image,
    category: getCategoryName(e.category_id),
    date: formatDate(e.start_time),
    rawDate: e.start_time ?? "",
    location: e.location_name,
    attendees: e.participants_count,
    spotsLeft,
    tags: [],
    ...(e.description && { description: e.description }),
    host: { name: e.client.name, avatar: e.client.avatar },
    participants: [],
    languages: Array.isArray(e.languages) ? e.languages : [],
  };
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
  const category = (typeof raw.category === 'string' && raw.category.trim() !== '' && raw.category !== 'Event') ? raw.category : getCategoryName(raw.category_id);
  const date = formatDate(raw.start_at ?? raw.date);
  const location = raw.place ?? raw.place_id ?? "TBA";
  const attendees = raw.taken_capacity ?? raw.max_clients ?? 0;
  const spotsLeft = raw.remaining_capacity ?? 0;
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const description = raw.description ?? undefined;
  const owner = raw.owner;
  const host =
    owner && (owner.name != null || owner.photo != null)
      ? {
        name: owner.name ?? "Host",
        avatar: owner.photo ?? "",
      }
      : undefined;

  const mappedParticipants = Array.isArray(raw.participants)
    ? raw.participants
      .map((p) => ({ avatar: p?.photo ?? p?.avatar ?? p?.image ?? "" }))
      .filter((p) => p.avatar !== "")
    : undefined;

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

/** Fetch all-feed via eventsClient; returns normalized featured + upcoming for UI */
export async function fetchAllFeed(clientId = "1"): Promise<{
  featured: FeedEvent[];
  upcoming: FeedEvent[];
}> {
  const events = await api.getEventsFull(clientId);

  const BASE_LAT = 38.7223;
  const BASE_LNG = -9.1393;
  const MAX_DISTANCE_KM = 250;

  // Show only events within the 250km radius
  const validEvents = events.filter((e) => {
    if (e.latitude != null && e.longitude != null && !isNaN(e.latitude) && !isNaN(e.longitude)) {
      const distance = getDistanceInKm(BASE_LAT, BASE_LNG, e.latitude, e.longitude);
      return distance <= MAX_DISTANCE_KM;
    }
    return false;
  });

  const all = validEvents.map(eventToFeedEvent);
  const featured = all.slice(0, 2);
  const upcoming = all.slice(2);
  return { featured, upcoming };
}
