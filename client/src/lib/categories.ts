export const EVENT_CATEGORIES: Record<number | string, string> = {
    1: "Sports",
    2: "Food",
    4: "Travel",
    5: "Cinema / Theatre",
    6: "Evening activity",
    7: "Gaming",
    8: "Board games",
    12: "Business",
    13: "Other",
    15: "Concerts",
    16: "Online"
};

export const getCategoryName = (id?: number | string | null): string => {
    if (id == null) return "Event";
    return EVENT_CATEGORIES[id] || `Category ${id}`;
};
