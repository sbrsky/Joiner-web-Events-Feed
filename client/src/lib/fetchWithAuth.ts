import { auth } from "./firebase";

const sessionId = crypto.randomUUID();

export const fetchWithAuth = async (url: string | URL, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});

    // Add standard headers
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('session_id', sessionId);
    headers.set('request_id', crypto.randomUUID());

    // You can pull locale from useAuth or localStorage, hardcoded to ru for now per instructions
    headers.set('J-LOCALE', 'en');

    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            headers.set('Authorization', `Bearer ${token}`);
        }
    } catch (error) {
        console.error("Error getting auth token:", error);
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Handle 401 unauthorized
    if (response.status === 401 && auth.currentUser) {
        try {
            // Force refresh token
            const refreshedToken = await auth.currentUser.getIdToken(true);
            headers.set('Authorization', `Bearer ${refreshedToken}`);
            headers.set('request_id', crypto.randomUUID());

            // Retry once
            return fetch(url, {
                ...options,
                headers
            });
        } catch (error) {
            console.error("Failed to refresh token", error);
            await auth.signOut();
            window.location.href = '/?login=failed';
        }
    }

    return response;
};
