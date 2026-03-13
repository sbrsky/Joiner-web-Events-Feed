// For dev purposes: Uses the dev.api.getjoiner.com service feed endpoint
import { FeedEvent, RawApiEvent } from "@/types/events";
import { mapApiEventToFeedEvent, getDistanceInKm } from "./feed";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { DEFAULT_LOCATION, DEFAULT_DISTANCE_KM } from "@/lib/constants";

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

    async getFeed(page: number = 1, forWebview: 0 | 1 = 0, isAuth: boolean = false, customLat?: number, customLng?: number, customDistance?: number, categories?: number[], languages?: string[], timezone?: string): Promise<{ events: FeedEvent[]; meta: { current_page: number; last_page: number } }> {
        const endpoint = isAuth ? `/api/v2/feed/following` : `/api/service/feed`;
        const url = new URL(`${this.baseUrl}${endpoint}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");
        url.searchParams.append("page", page.toString());

        const lat = customLat ?? DEFAULT_LOCATION.lat;
        const lng = customLng ?? DEFAULT_LOCATION.lng;
        const dist = customDistance ?? DEFAULT_DISTANCE_KM;

        if (isAuth) {
            url.searchParams.append("lat", lat.toString());
            url.searchParams.append("lng", lng.toString());
            url.searchParams.append("distance", dist.toString());
            url.searchParams.append("page_size", "10");

            if (categories && categories.length > 0) {
                categories.forEach(id => url.searchParams.append("category_id[]", id.toString()));
            }
            if (languages && languages.length > 0) {
                languages.forEach(code => url.searchParams.append("language_code[]", code));
            }
            if (timezone) {
                url.searchParams.append("timezone", timezone);
            }
        } else {
            url.searchParams.append("for_webview", forWebview.toString());
            url.searchParams.append("lat", lat.toString());
            url.searchParams.append("lng", lng.toString());
            url.searchParams.append("distance", dist.toString());
        }

        const response = isAuth
            ? await fetchWithAuth(url.toString(), { method: "GET" })
            : await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                },
            });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json: any = await response.json();


        let rawEvents: (RawApiEvent & { _apiGroup?: string })[] = [];

        // Handle the /api/feed grouped structure
        if (json.data && typeof json.data === 'object' && !Array.isArray(json.data) && (json.data.new || json.data.today || json.data.this_week || json.data.later)) {
            if (forWebview === 1) {
                // Featured/Don't miss out category is "new"
                const newEvents = json.data.new || [];
                const promotedEvents = json.data.promoted || [];
                rawEvents = [
                    ...promotedEvents.map((e: any) => ({ ...e, _apiGroup: 'promoted' })),
                    ...newEvents.map((e: any) => ({ ...e, _apiGroup: 'new' }))
                ];
            } else {
                // Upcoming categories in specific order
                const categories = ['today', 'tomorrow', 'this_week', 'this_weekend', 'next_week', 'later'];
                categories.forEach(cat => {
                    if (Array.isArray(json.data[cat])) {
                        const grouped = json.data[cat].map((e: any) => ({ ...e, _apiGroup: cat }));
                        rawEvents = [...rawEvents, ...grouped];
                    }
                });
            }
        }
        // Handle common flat structures
        else if (Array.isArray(json.data)) {
            rawEvents = json.data;
        } else if (Array.isArray(json.events)) {
            rawEvents = json.events;
        } else if (Array.isArray(json)) {
            rawEvents = json;
        } else if (json.data && Array.isArray(json.data.events)) {
            rawEvents = json.data.events;
        } else if (json.data && Array.isArray(json.data.data)) {
            rawEvents = json.data.data;
        }

        if (!Array.isArray(rawEvents)) {
            console.error("API response didn't contain an array or identifiable grouped events!", json);
            rawEvents = [];
        }

        const validEvents = rawEvents; // The distance filtering is handled by the backend

        const events = validEvents.map((raw: any, index: number) => {
            const mapped = mapApiEventToFeedEvent(raw, index);
            if (raw._apiGroup) mapped.apiGroup = raw._apiGroup;
            return mapped;
        });

        const meta = json.meta || {
            current_page: json.current_page || page,
            last_page: json.last_page || (rawEvents.length < 10 ? page : page + 1),
        };

        return {
            events,
            meta,
        };
    }

    async getFeedByTimeline(tab: string, page: number = 1, pageSize: number = 10, lat?: number, lng?: number, distance?: number, timezone?: string, isAuth: boolean = false): Promise<{ events: FeedEvent[]; meta: { current_page: number; last_page: number } }> {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";

        const endpoint = isAuth ? '/api/v2/feed' : '/api/service/feed';
        const url = new URL(`${this.baseUrl}${endpoint}`, baseUrl);
        url.searchParams.append("tab", tab);

        // Always include page to support pagination correctly (1 by default)
        url.searchParams.append("page", page.toString());
        url.searchParams.append("page_size", pageSize.toString());

        if (lat !== undefined && lng !== undefined) {
            url.searchParams.append("lat", lat.toString());
            url.searchParams.append("lng", lng.toString());
        }

        if (distance !== undefined) {
            url.searchParams.append("distance", distance.toString());
        }

        if (timezone) {
            url.searchParams.append("timezone", timezone);
        }

        const response = isAuth
            ? await fetchWithAuth(url.toString(), { method: "GET" })
            : await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                },
            });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json: any = await response.json();

        let rawEvents = [];
        if (Array.isArray(json.data)) {
            rawEvents = json.data;
        } else if (json.data && Array.isArray(json.data.data)) {
            rawEvents = json.data.data;
        } else if (Array.isArray(json)) {
            rawEvents = json;
        }

        const events = rawEvents.map((raw: any, index: number) => {
            return mapApiEventToFeedEvent(raw, index);
        });

        const metaData = json.meta || (json.data && json.data.meta) || {};

        const meta = {
            current_page: metaData.current_page || json.current_page || page,
            last_page: metaData.last_page || json.last_page || (rawEvents.length < pageSize ? page : page + 1),
            total: metaData.total || json.total || rawEvents.length,
        };

        return {
            events,
            meta,
        };
    }
    async getFriendsGoingFeed(page: number = 1, lat?: number, lng?: number, distance?: number, timezone?: string): Promise<{ events: FeedEvent[]; meta: { current_page: number; last_page: number } }> {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
        const url = new URL(`${this.baseUrl}/api/v2/feed/friends-going`, baseUrl);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("page_size", "10");

        if (lat !== undefined && lng !== undefined) {
            url.searchParams.append("lat", lat.toString());
            url.searchParams.append("lng", lng.toString());
        }
        if (distance !== undefined) {
            url.searchParams.append("distance", distance.toString());
        }
        if (timezone) {
            url.searchParams.append("timezone", timezone);
        }

        const response = await fetchWithAuth(url.toString(), { method: "GET" });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json: any = await response.json();

        let rawEvents: RawApiEvent[] = [];
        if (Array.isArray(json.data)) {
            rawEvents = json.data;
        } else if (json.data && Array.isArray(json.data.data)) {
            rawEvents = json.data.data;
        } else if (Array.isArray(json)) {
            rawEvents = json;
        }

        const events = rawEvents.map((raw: any, index: number) => {
            const mapped = mapApiEventToFeedEvent(raw, index);
            mapped.isFriendsGoing = true;
            return mapped;
        });

        const metaData = json.meta || {};
        const meta = {
            current_page: metaData.current_page || json.current_page || page,
            last_page: metaData.last_page || json.last_page || (rawEvents.length < 10 ? page : page + 1),
        };

        return { events, meta };
    }

    async getClientUpcomingEvents(client: string | number): Promise<{ events: FeedEvent[] }> {
        const url = `${this.baseUrl}/api/client/${client}/events/upcoming`;
        const response = await fetchWithAuth(url, { method: "GET" });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json: any = await response.json();
        let rawEvents: RawApiEvent[] = [];
        
        if (Array.isArray(json.data)) {
            rawEvents = json.data;
        } else if (json.data && Array.isArray(json.data.events)) {
            rawEvents = json.data.events;
        } else if (Array.isArray(json.events)) {
            rawEvents = json.events;
        } else if (Array.isArray(json)) {
            rawEvents = json;
        }

        const events = rawEvents.map((raw: any, index: number) => {
            return mapApiEventToFeedEvent(raw, index);
        });

        return { events };
    }

    async getClientDetails(id: string | number): Promise<any> {
        const url = `${this.baseUrl}/api/client/${id}`;
        const response = await fetchWithAuth(url, { method: "GET" });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        return json.data || json;
    }
}

export const serviceFeed = new ServiceFeedClient();
