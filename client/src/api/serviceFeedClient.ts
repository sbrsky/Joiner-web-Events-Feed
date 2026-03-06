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

    async getFeed(page: number = 1, forWebview: 0 | 1 = 0, isAuth: boolean = false): Promise<{ events: FeedEvent[]; meta: { current_page: number; last_page: number } }> {
        const endpoint = isAuth ? `/api/feed` : `/api/service/feed`;
        const url = new URL(`${this.baseUrl}${endpoint}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");
        url.searchParams.append("page", page.toString());
        if (isAuth) {
            url.searchParams.append("lat", DEFAULT_LOCATION.lat.toString());
            url.searchParams.append("lng", DEFAULT_LOCATION.lng.toString());
        } else {
            url.searchParams.append("for_webview", forWebview.toString());
            url.searchParams.append("lat", DEFAULT_LOCATION.lat.toString());
            url.searchParams.append("lng", DEFAULT_LOCATION.lng.toString());
            url.searchParams.append("distance", DEFAULT_DISTANCE_KM.toString());
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

        const BASE_LAT = DEFAULT_LOCATION.lat;
        const BASE_LNG = DEFAULT_LOCATION.lng;
        const MAX_DISTANCE_KM = DEFAULT_DISTANCE_KM;

        const validEvents = isAuth ? rawEvents : rawEvents.filter((raw: RawApiEvent) => {
            const latRaw = raw.latitude ?? raw.lat ?? (raw.location as any)?.lat ?? (raw.location as any)?.latitude;
            const lngRaw = raw.longitude ?? raw.lng ?? (raw.location as any)?.lng ?? (raw.location as any)?.longitude;

            const lat = latRaw != null ? Number(latRaw) : null;
            const lng = lngRaw != null ? Number(lngRaw) : null;

            if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
                const distance = getDistanceInKm(BASE_LAT, BASE_LNG, lat, lng);
                return distance <= MAX_DISTANCE_KM;
            }
            return false;
        });

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

    async getFeedByTimeline(tab: string, page: number = 1, pageSize: number = 10, lat?: number, lng?: number, distance?: number, timezone?: string): Promise<{ events: FeedEvent[]; meta: { current_page: number; last_page: number } }> {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";

        const url = new URL(`${this.baseUrl}/api/service/feed`, baseUrl);
        url.searchParams.append("tab", tab);

        // Always include page to support pagination correctly (1 by default)
        url.searchParams.append("page", page.toString());

        if (lat !== undefined && lng !== undefined) {
            url.searchParams.append("lat", lat.toString());
            url.searchParams.append("lng", lng.toString());
        }

        if (distance !== undefined) {
            url.searchParams.append("distance", distance.toString());
        }

        const response = await fetch(url.toString(), {
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
}

export const serviceFeed = new ServiceFeedClient();
