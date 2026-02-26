// For dev purposes: Uses the dev.api.getjoiner.com service feed endpoint
import { FeedEvent, RawApiEvent } from "@/types/events";
import { mapApiEventToFeedEvent } from "./feed";

export interface ServiceFeedResponse {
    data?: RawApiEvent[];
    events?: RawApiEvent[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    current_page?: number;
    last_page?: number;
}

export class ServiceFeedClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "/api/proxied";
    }

    async getFeed(page: number = 1, forWebview: 0 | 1 = 0): Promise<{ events: FeedEvent[]; meta: { current_page: number; last_page: number } }> {
        const url = new URL(`${this.baseUrl}/api/service/feed`, window.location.origin);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("for_webview", forWebview.toString());
        // Arrays are appended with []
        // url.searchParams.append("category_id[]", ""); 
        // url.searchParams.append("language_code[]", "");

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json: ServiceFeedResponse = await response.json();

        const rawEvents = json.data || json.events || (Array.isArray(json) ? json : []);
        const events = rawEvents.map((raw: RawApiEvent, index: number) => mapApiEventToFeedEvent(raw, index));

        const meta = json.meta || {
            current_page: json.current_page || page,
            last_page: json.last_page || (rawEvents.length < 10 ? page : page + 1),
        };

        return {
            events,
            meta,
        };
    }
}

export const serviceFeed = new ServiceFeedClient();
