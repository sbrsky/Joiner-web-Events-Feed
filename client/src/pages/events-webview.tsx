import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { serviceFeed } from "@/api/serviceFeedClient";
import { GatherHomeLayout } from "./GatherHomeLayout";
import { Button } from "@/components/ui/button";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_LOCATION, DEFAULT_DISTANCE_KM } from "@/lib/constants";

const DYNAMIC_CATEGORIES = [
  { name: "For You", icon: Sparkles },
  ...Object.values(EVENT_CATEGORIES).map(name => ({ name, icon: null }))
];

export default function EventsWebview() {
  const { user } = useAuth();
  const isAuth = !!user;

  const [activeCategory, setActiveCategory] = useState("For You");
  // No more activeTimeline state, we fetch all sections at once
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

      if (isRemoving) {
        const allAvailable = new Set([
          ...topPicks.flatMap(e => e.languages || []),
          ...upcomingEvents.flatMap(e => e.languages || [])
        ]);
        const selectedAvailableCount = prev.filter(l => allAvailable.has(l)).length;
        if (selectedAvailableCount <= 1 && allAvailable.has(lang)) {
          return prev;
        }
      }

      const next = isRemoving ? prev.filter(l => l !== lang) : [...prev, lang];
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedLanguages", JSON.stringify(next));
      }
      return next;
    });
  };

  const featuredQuery = useInfiniteQuery({
    queryKey: ["service-feed-featured", isAuth],
    queryFn: ({ pageParam = 1 }) => serviceFeed.getFeed(pageParam, 1, isAuth),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const todayQuery = useInfiniteQuery({
    queryKey: ["service-feed-today", isAuth],
    queryFn: ({ pageParam = 1 }) =>
      isAuth
        ? serviceFeed.getFeed(pageParam, 0, isAuth)
        : serviceFeed.getFeedByTimeline("today", pageParam, 10, DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_DISTANCE_KM),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const tomorrowQuery = useInfiniteQuery({
    queryKey: ["service-feed-tomorrow", isAuth],
    queryFn: ({ pageParam = 1 }) =>
      serviceFeed.getFeedByTimeline("tomorrow", pageParam, 10, DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_DISTANCE_KM),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !isAuth, // Only needed for guests since isAuth fetch returns everything
  });

  const laterQuery = useInfiniteQuery({
    queryKey: ["service-feed-later", isAuth],
    queryFn: ({ pageParam = 1 }) =>
      serviceFeed.getFeedByTimeline("later", pageParam, 10, DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_DISTANCE_KM),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !isAuth,
  });

  const topPicks = featuredQuery.data?.pages.flatMap((p) => p.events) ?? [];

  // Combine all upcoming events for guests, or use the grouped feed for auth
  let upcomingEvents: any[] = [];
  if (isAuth) {
    upcomingEvents = todayQuery.data?.pages.flatMap((p) => p.events) ?? [];
  } else {
    const todayEvents = (todayQuery.data?.pages.flatMap((p) => p.events) ?? []).map(e => ({ ...e, apiGroup: "today" }));
    const tomorrowEvents = (tomorrowQuery.data?.pages.flatMap((p) => p.events) ?? []).map(e => ({ ...e, apiGroup: "tomorrow" }));
    const laterEvents = (laterQuery.data?.pages.flatMap((p) => p.events) ?? []).map(e => ({ ...e, apiGroup: "later" }));
    upcomingEvents = [...todayEvents, ...tomorrowEvents, ...laterEvents];
  }

  const filterByLanguage = (events: any[]) => {
    if (selectedLanguages.length === 0) return events;
    return events.filter((e) => {
      const eventLangs = e.languages || [];
      if (eventLangs.length === 0) return true; // Show events with no language specified to avoid fully hiding everything by accident
      return eventLangs.some((l: string) => selectedLanguages.includes(l));
    });
  };

  const topPicksByLang = filterByLanguage(topPicks);

  const upcomingByLang = filterByLanguage(upcomingEvents);

  const filteredTopPicks = activeCategory === "For You"
    ? topPicksByLang
    : topPicksByLang.filter(e => e.category === activeCategory);

  const filteredUpcoming = activeCategory === "For You"
    ? upcomingByLang
    : upcomingByLang.filter(e => e.category === activeCategory);

  const availableLanguages = Array.from(new Set([
    ...topPicks.flatMap((e) => e.languages || []),
    ...upcomingEvents.flatMap((e) => e.languages || []),
  ])).filter(Boolean).sort();

  const availableCategoryNames = new Set([
    ...topPicks.map((e) => e.category),
    ...upcomingEvents.map((e) => e.category),
  ]);

  const availableCategories = DYNAMIC_CATEGORIES.filter(
    (cat) => cat.name === "For You" || availableCategoryNames.has(cat.name)
  );

  const commonProps = {
    activeCategory,
    setActiveCategory,
    featuredQuery,
    upcomingQuery: todayQuery, // Keep todayQuery as the main one for loading states
    tomorrowQuery,
    laterQuery,
    topPicks: filteredTopPicks,
    upcomingEvents: filteredUpcoming,
    CATEGORIES: availableCategories,
    selectedLanguages,
    availableLanguages,
    toggleLanguage,
    isAuth,
  };

  return (
    <GatherHomeLayout {...commonProps} />
  );
}
