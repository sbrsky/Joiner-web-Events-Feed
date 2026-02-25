/**
 * API client for events (all-feed). Calls our proxy at /api/all-feed; the server adds Bearer token to the backend.
 */

export interface Event {
  id: number;
  title: string;
  description: string;
  category_id: number;
  client: {
    id: number;
    name: string;
    avatar: string;
  };
  image: string;
  start_time: string;
  end_time: string;
  location_name: string;
  location_address: string;
  participants_count: number;
  max_participants: number | null;
  is_cancelled: boolean;
  price: number;
  currency: string;
}

export interface Statistics {
  totalEvents: number;
  totalParticipants: number;
  upcomingEventsCount: number;
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000&auto=format&fit=crop";

/** Raw item from all-feed API (backend shape) */
interface AllFeedItem {
  id?: number;
  name?: string;
  description?: string | null;
  category_id?: number;
  owner?: { id?: number; name?: string; photo?: string | null } | null;
  photo?: string | null;
  start_at?: string;
  end_at?: string;
  place?: string | null;
  place_address?: string | null;
  taken_capacity?: number;
  max_clients?: number | null;
  status?: string;
  price?: number;
  currency?: string;
  [key: string]: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "";
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers, credentials: "include" });
    const data = await response.json();

    if (data && typeof data === "object" && "code" in data && (data as { code: number }).code !== 200) {
      throw new Error(
        `API Internal Error: ${(data as { code: number }).code} - ${(data as { message?: string }).message || "Unknown error"}`
      );
    }

    if (!response.ok) {
      const msg = (data as { message?: string })?.message || response.statusText;
      throw new Error(`API HTTP Error: ${response.status} ${msg}`);
    }

    return (data && typeof data === "object" && "data" in data ? (data as { data: T }).data : data) as T;
  }

  async getEventsFull(clientId = "1"): Promise<Event[]> {
    const data = await this.request<AllFeedItem[]>(`/api/all-feed?client_id=${clientId}`);
    return (data || []).map((item) => ({
      id: item.id ?? 0,
      title: item.name ?? "No Title",
      description: item.description ?? "",
      category_id: item.category_id ?? 0,
      client: item.owner
        ? {
            id: item.owner.id ?? 0,
            name: item.owner.name ?? "Unknown",
            avatar: item.owner.photo ?? "",
          }
        : { id: 0, name: "Unknown", avatar: "" },
      image: item.photo ?? DEFAULT_IMAGE,
      start_time: item.start_at ?? "",
      end_time: item.end_at ?? "",
      location_name: item.place ?? "Somewhere",
      location_address: item.place_address ?? "",
      participants_count: item.taken_capacity ?? 0,
      max_participants: item.max_clients ?? null,
      is_cancelled: item.status === "cancelled",
      price: item.price ?? 0,
      currency: item.currency ?? "RUB",
    }));
  }

  async getUpcomingEvents(clientId = "1"): Promise<Event[]> {
    return this.getEventsFull(clientId);
  }

  async getStatistics(clientId = "1"): Promise<Statistics> {
    try {
      const events = await this.getEventsFull(clientId);
      const now = new Date();
      const totalParticipants = events.reduce((sum, e) => sum + (e.participants_count ?? 0), 0);
      return {
        totalEvents: events.length,
        totalParticipants,
        upcomingEventsCount: events.filter((e) => new Date(e.start_time) > now).length,
      };
    } catch (error) {
      console.warn("API Statistics fetch failed, using fallbacks:", error);
      return {
        totalEvents: 0,
        totalParticipants: 0,
        upcomingEventsCount: 0,
      };
    }
  }
}

export const api = new ApiClient();
