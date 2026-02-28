export function encodeEventId(id: string | number): string {
    const stringId = String(id);
    const rawData = `JNR-${stringId}`;
    return btoa(rawData).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeEventId(encodedId: string): string {
    if (!encodedId) return encodedId;
    try {
        let base64 = encodedId.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const decoded = atob(base64);
        if (decoded.startsWith('JNR-')) {
            return decoded.replace('JNR-', '');
        }
        return encodedId;
    } catch {
        return encodedId;
    }
}
