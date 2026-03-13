import { type Request } from "express";
import { decodeEventId } from "../client/src/lib/idUtils";

const EVENTS_API_URL = (process.env.EVENTS_API_URL || "https://api.getjoiner.com").replace(/\/$/, "");
const rawApiKey = process.env.EVENTS_API_KEY || "";
const AUTH_HEADER = rawApiKey.toLowerCase().startsWith('bearer ') ? rawApiKey : `Bearer ${rawApiKey}`;

interface EventMetaData {
  title: string;
  description: string;
  image: string;
}

async function getEventData(encodedId: string): Promise<EventMetaData | null> {
  try {
    const id = decodeEventId(encodedId);
    if (!id || id === encodedId && !/^\d+$/.test(id)) {
      // If it didn't decode to something sensible, it might not be a valid encoded ID
      // but let's try anyway if it looks like a number
    }

    const url = `${EVENTS_API_URL}/api/service/events/${id}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": AUTH_HEADER
      }
    });

    if (!response.ok) return null;

    const json = await response.json();
    const event = json.data || json;

    return {
      title: event.title || "JOINER Event",
      description: event.description || "Join this event on JOINER",
      image: event.image || event.cover_image || "https://getjoiner.com/assets/joiner-app-find-friends-1-9bthETbU.jpg"
    };
  } catch (error) {
    console.error("[SEO] Error fetching event data:", error);
    return null;
  }
}

export async function injectMetaTags(html: string, req: Request): Promise<string> {
  const url = req.originalUrl;
  const eventMatch = url.match(/\/event\/([^/?#]+)/);

  if (eventMatch) {
    const encodedId = eventMatch[1];
    const data = await getEventData(encodedId);

    if (data) {
      // Use a more robust replacement that doesn't depend on exact spacing
      const replaceMeta = (html: string, property: string, content: string, isName: boolean = false) => {
        const attr = isName ? 'name' : 'property';
        const regex = new RegExp(`<meta\\s+${attr}="${property}"\\s+content=".*?"\\s*\\/?>`, 'i');
        return html.replace(regex, `<meta ${attr}="${property}" content="${content.replace(/"/g, '&quot;')}" />`);
      };

      html = html.replace(/<title>.*?<\/title>/i, `<title>${data.title} - JOINER</title>`);
      
      html = replaceMeta(html, "og:title", data.title);
      html = replaceMeta(html, "og:description", data.description.substring(0, 200));
      html = replaceMeta(html, "og:image", data.image);
      
      html = replaceMeta(html, "twitter:title", data.title, true);
      html = replaceMeta(html, "twitter:description", data.description.substring(0, 200), true);
      html = replaceMeta(html, "twitter:image", data.image, true);
      
      return html;
    }
  }

  return html;
}
