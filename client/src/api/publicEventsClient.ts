import { FeedEvent, RawApiEvent } from "@/types/events";
import { mapApiEventToFeedEvent } from "./feed";

export interface PublicEventsResponse {
    data: RawApiEvent[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}

export class PublicEventsClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "/api/proxied";
    }

    async getUpcomingPublicEvents(
        page: number = 1,
        country: string = "lisbon"
    ): Promise<{ events: FeedEvent[]; meta: PublicEventsResponse["meta"] }> {
        const url = new URL(`${this.baseUrl}/api/events/upcoming-public`, typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");
        url.searchParams.append("country", country);
        url.searchParams.append("page", page.toString());

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json: PublicEventsResponse = await response.json();

        // Map raw events to FeedEvent using the helper from feed.ts
        const events = json.data.map(mapApiEventToFeedEvent);

        return {
            events,
            meta: json.meta,
        };
    }

    async getEventById(id: string): Promise<FeedEvent> {
        const url = new URL(`${this.baseUrl}/api/events/${id}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");
        // Often single event endpoints might be just /api/events/:id or /api/event/:id
        // Since we don't know for sure, let's assume /api/events/:id based on standard REST.
        // If it fails, we might need to adjust.

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        // The single event response format might differ. 
        // Typically it returns { data: Event } or just Event.
        // Let's assume { data: RawApiEvent } based on the collection format.

        const rawEvent = (json.data || json) as RawApiEvent;
        return mapApiEventToFeedEvent(rawEvent, 0);
    }
}

export const publicEvents = new PublicEventsClient();
