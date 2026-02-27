import { FeedEvent, RawApiEvent } from "@/types/events";
import { mapApiEventToFeedEvent } from "./feed";

export interface DetailedEvent extends FeedEvent {
    raw: RawApiEvent;
}

export class EventDetailsClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "/api/proxied";
    }

    async getEventDetails(id: string): Promise<DetailedEvent> {
        const url = `${this.baseUrl}/api/service/events/${id}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        // The endpoint returns the event data directly, or wrapped in data
        const rawEvent = (json.data || json) as RawApiEvent;

        // Map to FeedEvent, plus attach raw for detailed page
        const feedEvent = mapApiEventToFeedEvent(rawEvent, 0);
        return {
            ...feedEvent,
            raw: rawEvent
        };
    }

    async getDeepLink(id: string | number): Promise<string> {
        const url = new URL(`${this.baseUrl}/api/service/events/${id}/deep-link`, typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        return json.deep_link;
    }
}

export const eventDetails = new EventDetailsClient();
