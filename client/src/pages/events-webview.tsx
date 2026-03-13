import { useState, useMemo, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { serviceFeed } from "@/api/serviceFeedClient";
import { GatherHomeLayout } from "./GatherHomeLayout";
import { EVENT_CATEGORIES, getCategoryIdByName } from "@/lib/categories";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_DISTANCE_KM } from "@/lib/constants";
import { useLanguages } from "@/hooks/useLanguages";
import { useCountries } from "@/hooks/useCountries";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getEventCountry, getCountryCapital, getCountryRadius, COUNTRIES } from "@/lib/countries";

const DYNAMIC_CATEGORIES = [
  { name: "Personalised", icon: Sparkles },
  ...Object.values(EVENT_CATEGORIES).map(name => ({ name, icon: null }))
];

export default function EventsWebview() {
  const { user } = useAuth();
  const isAuth = !!user;

  const { data: config } = useQuery({
    queryKey: ["admin-config"],
    queryFn: () => fetch("/api/admin/analytics-config").then(r => r.json()),
  });

  const allowedCountriesIds = useMemo(() => config?.allowed_countries || ["PT", "LT", "LV"], [config]);

  const [activeCategory, setActiveCategory] = useState("Personalised");
  const { selectedLanguages, toggleLanguage } = useLanguages();
  const { selectedCountry, toggleCountry } = useCountries(allowedCountriesIds);
  const { location: geoLoc } = useGeolocation();

  const [geoCity, setGeoCity] = useState("Your Location");

  useEffect(() => {
    if (geoLoc) {
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${geoLoc.lat}&longitude=${geoLoc.lng}&localityLanguage=en`)
        .then(res => res.json())
        .then(data => {
          if (data.city) setGeoCity(data.city);
        })
        .catch(() => { });
    }
  }, [geoLoc]);

  const filteredCountries = useMemo(() => COUNTRIES.filter(c => allowedCountriesIds.includes(c.id)), [allowedCountriesIds]);

  const selectedCapital = getCountryCapital(selectedCountry);
  const isGeoInSelectedCountry = geoLoc && getEventCountry(geoLoc.lat, geoLoc.lng) === selectedCountry;

  const lat = isGeoInSelectedCountry ? geoLoc.lat : selectedCapital.lat;
  const lng = isGeoInSelectedCountry ? geoLoc.lng : selectedCapital.lng;

  const radius = getCountryRadius(selectedCountry);

  const featuredQuery = useInfiniteQuery({
    queryKey: ["service-feed-featured", isAuth, lat, lng, radius, activeCategory, selectedLanguages],
    queryFn: ({ pageParam = 1 }) => {
      const catId = activeCategory !== "Personalised" ? getCategoryIdByName(activeCategory) : undefined;
      const categories = catId ? [catId] : [];
      return serviceFeed.getFeed(pageParam, 1, isAuth, lat, lng, radius, categories, selectedLanguages, Intl.DateTimeFormat().resolvedOptions().timeZone);
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const todayQuery = useInfiniteQuery({
    queryKey: ["service-feed-today", isAuth, lat, lng, radius],
    queryFn: ({ pageParam = 1 }) =>
      serviceFeed.getFeedByTimeline("today", pageParam, 10, lat, lng, radius, undefined, isAuth),
    getNextPageParam: (lastPage: any) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const tomorrowQuery = useInfiniteQuery({
    queryKey: ["service-feed-tomorrow", isAuth, lat, lng, radius],
    queryFn: ({ pageParam = 1 }) =>
      serviceFeed.getFeedByTimeline("tomorrow", pageParam, 10, lat, lng, radius, undefined, isAuth),
    getNextPageParam: (lastPage: any) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const laterQuery = useInfiniteQuery({
    queryKey: ["service-feed-later", isAuth, lat, lng, radius],
    queryFn: ({ pageParam = 1 }) =>
      serviceFeed.getFeedByTimeline("later", pageParam, 10, lat, lng, radius, undefined, isAuth),
    getNextPageParam: (lastPage: any) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  // Friends Going feed (only when authenticated)
  const friendsGoingQuery = useQuery({
    queryKey: ["service-feed-friends-going", lat, lng, radius],
    queryFn: () => serviceFeed.getFriendsGoingFeed(1, lat, lng, radius, Intl.DateTimeFormat().resolvedOptions().timeZone),
    enabled: isAuth,
  });

  const topPicksRaw = featuredQuery.data?.pages.flatMap((p: any) => p.events) ?? [];
  const friendsGoingEvents = friendsGoingQuery.data?.events ?? [];

  // Interleave friends-going events into topPicks (every 2nd position)
  const topPicks = (() => {
    if (!isAuth || friendsGoingEvents.length === 0) return topPicksRaw;
    const merged: any[] = [];
    const existingIds = new Set(topPicksRaw.map((e: any) => e.id));
    const uniqueFriends = friendsGoingEvents.filter((e: any) => !existingIds.has(e.id));
    let fIdx = 0;
    for (let i = 0; i < topPicksRaw.length; i++) {
      merged.push(topPicksRaw[i]);
      if ((i + 1) % 2 === 0 && fIdx < uniqueFriends.length) {
        merged.push(uniqueFriends[fIdx++]);
      }
    }
    // Append remaining friends-going events
    while (fIdx < uniqueFriends.length) {
      merged.push(uniqueFriends[fIdx++]);
    }
    return merged;
  })();

  const todayEvents = (todayQuery.data?.pages.flatMap((p: any) => p.events) ?? []).map((e: any) => ({ ...e, apiGroup: "today" }));
  const tomorrowEvents = (tomorrowQuery.data?.pages.flatMap((p: any) => p.events) ?? []).map((e: any) => ({ ...e, apiGroup: "tomorrow" }));
  const laterEvents = (laterQuery.data?.pages.flatMap((p: any) => p.events) ?? []).map((e: any) => ({ ...e, apiGroup: "later" }));
  const upcomingEvents = [...todayEvents, ...tomorrowEvents, ...laterEvents];

  const filterByLanguage = (events: any[]) => {
    if (selectedLanguages.length === 0) return events;
    return events.filter((e) => {
      const eventLangs = e.languages || [];
      if (eventLangs.length === 0) return true;
      return eventLangs.some((l: string) => selectedLanguages.includes(l));
    });
  };

  const filterByCountry = (events: any[]) => {
    if (!selectedCountry) return events;
    return events.filter((e) => {
      const eLatRaw = e.raw?.latitude ?? e.raw?.lat ?? e.raw?.location?.lat ?? e.raw?.location?.latitude;
      const eLngRaw = e.raw?.longitude ?? e.raw?.lng ?? e.raw?.location?.lng ?? e.raw?.location?.longitude;

      const eLat = eLatRaw != null ? Number(eLatRaw) : null;
      const eLng = eLngRaw != null ? Number(eLngRaw) : null;

      const countryCode = getEventCountry(eLat ?? undefined, eLng ?? undefined);
      if (!countryCode) return true;
      return countryCode === selectedCountry;
    });
  };

  const topPicksFiltered = filterByCountry(filterByLanguage(topPicks));
  const upcomingFiltered = filterByCountry(filterByLanguage(upcomingEvents));

  const filteredTopPicks = activeCategory === "Personalised"
    ? topPicksFiltered
    : topPicksFiltered.filter((e: any) => e.category === activeCategory);

  const filteredUpcoming = activeCategory === "Personalised"
    ? upcomingFiltered
    : upcomingFiltered.filter((e: any) => e.category === activeCategory);

  const availableLanguages = Array.from(new Set([
    ...topPicks.flatMap((e: any) => e.languages || []),
    ...upcomingEvents.flatMap((e: any) => e.languages || []),
    ...selectedLanguages,
    'en', 'pt', 'ru', 'es'
  ])).filter(Boolean).sort();

  const availableCategoryNames = new Set([
    ...topPicks.map((e: any) => e.category),
    ...upcomingEvents.map((e: any) => e.category),
  ]);

  const availableCategories = DYNAMIC_CATEGORIES.filter(
    (cat: any) => {
      if (cat.name === "Personalised" && (config?.is_login_enabled === false)) return false;
      return cat.name === "Personalised" || availableCategoryNames.has(cat.name);
    }
  );

  const commonProps = {
    activeCategory,
    setActiveCategory,
    featuredQuery,
    upcomingQuery: todayQuery,
    tomorrowQuery,
    laterQuery,
    topPicks: filteredTopPicks,
    upcomingEvents: filteredUpcoming,
    CATEGORIES: availableCategories,
    selectedLanguages,
    availableLanguages,
    toggleLanguage,
    selectedCountry,
    toggleCountry,
    countries: filteredCountries,
    allCountriesCount: COUNTRIES.length,
    isAuth,
    geoCity,
    isLoginEnabled: config?.is_login_enabled !== false,
  };

  return (
    <GatherHomeLayout {...commonProps} />
  );
}
