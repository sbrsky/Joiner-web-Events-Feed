import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface CreateEventPayload {
    title: string;
    description: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    isPublic: boolean;
    minAge: number;
    maxAge: number;
    categoryId: number;
    gender: 'male' | 'female' | 'all';
    maxClients: number;
    placeId?: string;
    lat?: number;
    lng?: number;
}

const MOCK_CREATION = false; // Set to false for production

export class EventCreatorClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "/api/proxied";
    }

    private generateId() {
        return typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2);
    }

    private dataURLtoFile(dataurl: string, filename: string) {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    async uploadImageToFirebase(file: File): Promise<{ url: string; public_id: string }> {
        // Removed .jpg to match your example: /o/images%2F1773325869600
        const filename = `${Date.now()}`;
        const path = `images/${filename}`;
        const storageRef = ref(storage, path);
        
        console.log(`[Firebase Storage] Uploading to ${path}...`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef); // This gets the full URL with token: https://firebasestorage...alt=media&token=...
        console.log(`[Firebase Storage] Upload success! URL: ${url}`);
        
        return { url, public_id: filename };
    }

    async createEvent(payload: CreateEventPayload, token: string): Promise<{ eventId: string }> {
        if (MOCK_CREATION) {
            console.log("[MOCK] Creating event with payload:", payload);
            await new Promise((resolve) => setTimeout(resolve, 800)); // simulate network latency
            return { eventId: "mock-event-" + this.generateId() };
        }

        const realPayload = {
            name: payload.title,
            category_id: payload.categoryId,
            is_meta: false,
            description: payload.description,
            start_at: `${payload.date}T${payload.startTime}:00Z`,
            end_at: `${payload.date}T${payload.endTime}:00Z`,
            price: 0,
            place: payload.location,
            place_id: payload.placeId || null,
            lat: payload.lat || 0,
            lng: payload.lng || 0,
            min_clients: 1,
            max_clients: payload.maxClients,
            min_age: payload.minAge,
            max_age: payload.maxAge,
            only_followers: false,
            gender: payload.gender === 'all' ? "male" : payload.gender, // Defaulting to male if anyone, as null might fail validation
            extra_description: "",
            meta_title: payload.title,
            meta_description: payload.description.substring(0, 160),
            covid_pass: false,
            status: "published",
            is_private: !payload.isPublic,
            is_auto_approve: true,
            level: 5,
            prices: [
                {
                    min_people: 0,
                    price: 0
                }
            ],
            currency: "EUR",
            language_code: "en",
            languages: ["en"]
        };

        console.log("[API Request] POST /api/events with payload:", JSON.stringify(realPayload, null, 2));

        const response = await fetchWithAuth(`${this.baseUrl}/api/events`, {
            method: "POST",
            body: JSON.stringify(realPayload),
        });

        if (!response.ok) {
            let errorDetail = "";
            try {
                const errorJson = await response.json();
                errorDetail = JSON.stringify(errorJson, null, 2);
            } catch (e) {
                errorDetail = await response.text();
            }
            console.error("[API Error] Failed to create event:", response.status, errorDetail);
            throw new Error(`Failed to create event: ${errorDetail}`);
        }

        const data = await response.json();
        console.log("[API Success] Event created:", data);
        return { eventId: data.id || data.eventId || (data.data && data.data.id) };
    }

    async attachMediaToEvent(eventId: string, storageData: { url: string; public_id: string }, order: number, _token: string): Promise<boolean> {
        // To ensure the full URL (with token) is saved in the DB, 
        // we pass the full storageData.url as the "name" parameter.
        const payload = {
            name: storageData.url, 
            order: order
        };

        if (MOCK_CREATION) {
            console.log(`[MOCK] Attaching media to event ${eventId}:`, payload);
            await new Promise((resolve) => setTimeout(resolve, 500));
            return true;
        }

        console.log(`[API Request] POST /api/events/${eventId}/media with payload:`, JSON.stringify(payload, null, 2));

        const response = await fetchWithAuth(`${this.baseUrl}/api/events/${eventId}/media`, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorDetail = "";
            try {
                const errorJson = await response.json();
                errorDetail = JSON.stringify(errorJson, null, 2);
            } catch (e) {
                errorDetail = await response.text();
            }
            console.error(`[API Error] Failed to attach media to event ${eventId}:`, response.status, errorDetail);
            throw new Error(`Failed to attach media: ${errorDetail}`);
        }

        console.log(`[API Success] Media attached to ${eventId}`);
        return true;
    }

    /**
     * Complete unified flow based on `event_creation_process.md.resolved`
     */
    async executeCreationFlow(payload: CreateEventPayload, imageSource: { file?: File, url?: string }, token: string = "mock-token"): Promise<string> {
        console.log("--- Starting Event Creation Flow ---");

        let mediaData: { url: string; public_id: string };

        if (imageSource.file) {
            // 1. Upload the physical image to Firebase Storage
            console.log("Step 1: Uploading image to Firebase Storage...");
            mediaData = await this.uploadImageToFirebase(imageSource.file);
        } else if (imageSource.url) {
            // If it's an AI-generated Base64 image, we MUST upload it to Firebase first
            if (imageSource.url.startsWith("data:")) {
                console.log("Step 1 (AI): Converting AI image to file and uploading to Firebase...");
                const file = this.dataURLtoFile(imageSource.url, `ai_generated_${Date.now()}.png`);
                mediaData = await this.uploadImageToFirebase(file);
            } else {
                mediaData = { url: imageSource.url, public_id: `external_${this.generateId()}` };
            }
        } else {
            throw new Error("No image source provided");
        }

        console.log("Upload/Image source processed (Firebase):", mediaData);

        // 2. Create the empty event
        console.log("Step 2: Creating empty event entity...");
        const { eventId } = await this.createEvent(payload, token);
        console.log(`Event created with ID: ${eventId}`);

        // 3. Attach media to the new event
        console.log("Step 3: Attach media to event...");
        await this.attachMediaToEvent(eventId, mediaData, 0, token);

        console.log(`--- Event Creation Flow Complete: ${eventId} ---`);
        return eventId;
    }
}

export const eventCreatorClient = new EventCreatorClient();
