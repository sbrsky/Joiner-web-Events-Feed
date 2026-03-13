import { useState, useEffect } from "react";
import { COUNTRIES } from "@/lib/countries";

export function useCountries(allowedCountries: string[] = ["PT", "LT", "LV"]) {
    const [selectedCountry, setSelectedCountry] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("selectedCountry");
                // if previously saved multiple countries as array, clear it
                if (saved && saved.startsWith("[")) {
                    localStorage.removeItem("selectedCountry");
                    return null;
                }
                if (saved && allowedCountries.includes(saved)) {
                    return saved;
                }
            } catch {
                return null;
            }
        }
        return null;
    });

    useEffect(() => {
        if (selectedCountry) return;

        // Determine by IP
        fetch("https://ipapi.co/json/")
            .then(res => res.json())
            .then(data => {
                const code = data.country_code;
                if (code && allowedCountries.includes(code)) {
                    setSelectedCountry(code);
                    localStorage.setItem("selectedCountry", code);
                } else {
                    // default to the first allowed country (e.g. PT)
                    setSelectedCountry(allowedCountries[0]);
                    localStorage.setItem("selectedCountry", allowedCountries[0]);
                }
            })
            .catch(() => {
                setSelectedCountry(allowedCountries[0]);
                localStorage.setItem("selectedCountry", allowedCountries[0]);
            });
    }, [selectedCountry, allowedCountries]);

    const toggleCountry = (id: string) => {
        setSelectedCountry(id);
        localStorage.setItem("selectedCountry", id);
    };

    return { selectedCountry, toggleCountry };
}
