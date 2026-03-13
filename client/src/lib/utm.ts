export interface UTMTags {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const STORAGE_KEY = 'joiner_incoming_utm';

export function captureUTMs() {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const captured: UTMTags = {};
    let hasUtm = false;

    UTM_KEYS.forEach(key => {
        const val = urlParams.get(key);
        if (val) {
            captured[key] = val;
            hasUtm = true;
        }
    });

    if (hasUtm) {
        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
            console.log('[UTM] Captured and saved incoming UTMs:', captured);
        } catch (e) {
            console.warn('[UTM] Failed to save UTMs to localStorage:', e);
        }
    }
}

export function getStoredUTMs(): UTMTags {
    if (typeof window === 'undefined') return {};

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as UTMTags;
        }
    } catch (e) {
        console.warn('[UTM] Failed to read UTMs from localStorage:', e);
    }
    return {};
}

export function clearUTMs() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
