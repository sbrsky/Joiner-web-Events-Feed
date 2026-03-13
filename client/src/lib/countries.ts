export interface Country {
    id: string;
    name: string;
    flag: string;
    capital: {
        lat: number;
        lng: number;
    };
    capitalName: string;
    radius: number;
    bounds: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
}

export const COUNTRIES: Country[] = [
    {
        id: "PT",
        name: "Portugal",
        flag: "🇵🇹",
        capital: { lat: 38.7223, lng: -9.1393 }, // Lisbon
        capitalName: "LISBON",
        radius: 400,
        bounds: {
            minLat: 36.9,
            maxLat: 42.2,
            minLng: -9.5,
            maxLng: -6.1,
        },
    },
    {
        id: "LT",
        name: "Lithuania",
        flag: "🇱🇹",
        capital: { lat: 54.6872, lng: 25.2797 }, // Vilnius
        capitalName: "VILNIUS",
        radius: 150,
        bounds: {
            minLat: 53.8,
            maxLat: 56.5,
            minLng: 20.9,
            maxLng: 26.9,
        },
    },
    {
        id: "LV",
        name: "Latvia",
        flag: "🇱🇻",
        capital: { lat: 56.9496, lng: 24.1052 }, // Riga
        capitalName: "RIGA",
        radius: 150,
        bounds: {
            minLat: 55.6,
            maxLat: 58.1,
            minLng: 20.9,
            maxLng: 28.3,
        },
    },
];

export function getEventCountry(lat?: number, lng?: number): string | null {
    if (lat == null || lng == null) return null;

    for (const country of COUNTRIES) {
        if (
            lat >= country.bounds.minLat &&
            lat <= country.bounds.maxLat &&
            lng >= country.bounds.minLng &&
            lng <= country.bounds.maxLng
        ) {
            return country.id;
        }
    }

    return null;
}

export function getCountryCapital(countryId: string | null) {
    if (!countryId) return COUNTRIES[0].capital;
    const country = COUNTRIES.find(c => c.id === countryId);
    return country ? country.capital : COUNTRIES[0].capital;
}

export function getCountryRadius(countryId: string | null) {
    if (!countryId) return COUNTRIES[0].radius;
    const country = COUNTRIES.find(c => c.id === countryId);
    return country ? country.radius : COUNTRIES[0].radius;
}
