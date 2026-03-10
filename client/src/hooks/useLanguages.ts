import { useState, useEffect } from "react";

export function useLanguages() {
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("selectedLanguages");
                return saved ? JSON.parse(saved) : ["en"];
            } catch {
                return ["en"];
            }
        }
        return ["en"];
    });

    const toggleLanguage = (lang: string) => {
        setSelectedLanguages((prev) => {
            const isRemoving = prev.includes(lang);
            let next;
            if (isRemoving) {
                next = prev.filter((l) => l !== lang);
            } else {
                next = [...prev, lang];
            }
            localStorage.setItem("selectedLanguages", JSON.stringify(next));
            return next;
        });
    };

    return { selectedLanguages, toggleLanguage };
}
