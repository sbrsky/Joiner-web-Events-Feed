import { useState, useEffect } from 'react';

export type GeoPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export function useGeolocation() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState<GeoPermissionStatus>('prompt');

    const checkPermission = async () => {
        if (!navigator.permissions || !navigator.permissions.query) {
            setPermissionStatus('unsupported');
            return;
        }

        try {
            const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            setPermissionStatus(status.state as GeoPermissionStatus);
            
            status.onchange = () => {
                setPermissionStatus(status.state as GeoPermissionStatus);
            };
        } catch (e) {
            console.warn('Permissions API query failed:', e);
            setPermissionStatus('unsupported');
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setError(null);
                setLoading(false);
                setPermissionStatus('granted');
            },
            (err) => {
                setError(err.message);
                setLoading(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionStatus('denied');
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        checkPermission();
        // Automatically try to get location if we might already have permission
        // but don't force a prompt yet if it's 'prompt' status
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setLoading(false);
                    setPermissionStatus('granted');
                },
                () => {
                    setLoading(false);
                },
                { enableHighAccuracy: false, timeout: 2000, maximumAge: 300000 }
            );
        } else {
            setLoading(false);
        }
    }, []);

    return { location, error, loading, permissionStatus, requestLocation };
}
