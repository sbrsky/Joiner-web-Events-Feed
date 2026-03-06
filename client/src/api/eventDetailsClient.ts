import { FeedEvent, RawApiEvent } from "@/types/events";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { mapApiEventToFeedEvent } from "./feed";
import { auth } from "@/lib/firebase";

export interface DetailedEvent extends FeedEvent {
    raw: RawApiEvent;
}

const generateId = () => {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);
};

const sessionId = generateId();

export class EventDetailsClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "/api/proxied";
    }

    async getEventDetails(id: string, isAuth: boolean = false): Promise<DetailedEvent> {
        const endpoint = isAuth ? `/api/events/${id}` : `/api/service/events/${id}`;
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };

        if (isAuth) {
            headers["session_id"] = sessionId;
            headers["request_id"] = generateId();
            headers["J-LOCALE"] = "en";

            try {
                const user = auth.currentUser;
                if (user) {
                    const token = await user.getIdToken();
                    headers["Authorization"] = `Bearer ${token}`;
                } else {
                    console.log("[Event Details] No current user found, skipping auth header.");
                }
            } catch (err) {
                console.error("[Event Details] Failed to get Firebase token", err);
            }
        }

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Event Details] API Error Response [${response.status}]:`, errText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const textResponse = await response.text();

        let json;
        try {
            json = JSON.parse(textResponse);
        } catch (e) {
            console.error("[Event Details] Failed to parse JSON", e);
            throw new Error("Invalid response format");
        }

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

    async joinEvent(id: string): Promise<any> {
        const url = `${this.baseUrl}/api/v2/events/${id}/join`;

        const response = await fetchWithAuth(url, {
            method: "PUT",
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Event Join] API Error Response [${response.status}]:`, errText);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async getParticipationStatus(id: string): Promise<any> {
        const url = `${this.baseUrl}/api/events/${id}/client/participation-status`;

        try {
            const response = await fetchWithAuth(url, {
                method: "GET",
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Not participating
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (e) {
            console.error("[Event Details] Failed to fetch participation status:", e);
            return null;
        }
    }
}

export const eventDetails = new EventDetailsClient();
