/** Unified event shape for list/featured cards (from API or mock) */
export interface FeedEvent {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
  rawDate: string;
  location: string;
  attendees: number;
  spotsLeft: number;
  tags: string[];
  description?: string;
  host?: { name: string; avatar: string };
  participants?: { avatar: string }[];
  languages?: string[];
  apiGroup?: string;
}

/** Owner from backend */
export interface RawApiOwner {
  id?: number;
  name?: string;
  photo?: string | null;
  username?: string;
  about?: string;
  linkedin?: string;
  instagram?: { username: string };
  [key: string]: any;
}

/** Raw API event item (backend all-feed shape) */
export interface RawApiEvent {
  id?: string | number;
  name?: string;
  title?: string;
  description?: string | null;
  photo?: string | null;
  image?: string;
  image_url?: string;
  place?: string | null;
  place_id?: string | null;
  start_at?: string;
  end_at?: string;
  date?: string;
  category_id?: number;
  category?: string;
  remaining_capacity?: number;
  max_clients?: number;
  taken_capacity?: number;
  owner?: RawApiOwner | null;
  media?: unknown[];
  extra_description?: string | null;
  min_age?: number;
  max_age?: number;
  gender?: string | null;
  languages?: string[];
  prices?: { price: number; min_people?: number }[];
  participants?: any[];
  instructions?: string | null;
  currency?: string;
  covid_pass?: boolean;
  [key: string]: any;
}

/** API response can be array or { events: [...] } */
export type AllFeedResponse = RawApiEvent[] | { events?: RawApiEvent[]; data?: RawApiEvent[] };
