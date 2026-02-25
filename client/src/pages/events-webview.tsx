import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { serviceFeed } from "@/api/serviceFeedClient";
import { GatherHomeLayout } from "./GatherHomeLayout";
import { Button } from "@/components/ui/button";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { Sparkles } from "lucide-react";

const DYNAMIC_CATEGORIES = [
  { name: "For You", icon: Sparkles },
  ...Object.values(EVENT_CATEGORIES).map(name => ({ name, icon: null }))
];

export default function EventsWebview() {
  const [activeCategory, setActiveCategory] = useState("For You");

  const featuredQuery = useInfiniteQuery({
    queryKey: ["service-feed-featured"],
    queryFn: ({ pageParam = 1 }) => serviceFeed.getFeed(pageParam, 1),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const upcomingQuery = useInfiniteQuery({
    queryKey: ["service-feed-upcoming"],
    queryFn: ({ pageParam = 1 }) => serviceFeed.getFeed(pageParam, 0),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const topPicks = featuredQuery.data?.pages.flatMap((p) => p.events) ?? [];
  const upcomingEvents = upcomingQuery.data?.pages.flatMap((p) => p.events) ?? [];

  const filteredTopPicks = activeCategory === "For You"
    ? topPicks
    : topPicks.filter(e => e.category === activeCategory);

  const filteredUpcoming = activeCategory === "For You"
    ? upcomingEvents
    : upcomingEvents.filter(e => e.category === activeCategory);

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
    upcomingQuery,
    topPicks: filteredTopPicks,
    upcomingEvents: filteredUpcoming,
    CATEGORIES: availableCategories,
  };

  return (
    <GatherHomeLayout {...commonProps} />
  );
}
