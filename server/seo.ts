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

function getEventImage(raw: any): string {
  const DEFAULT_IMAGE = "https://getjoiner.com/assets/joiner-app-find-friends-1-9bthETbU.jpg";
  let img = DEFAULT_IMAGE;
  const media = raw.media;
  if (Array.isArray(media) && media.length > 0) {
    const first = media[0] as { url?: string; link?: string; original_url?: string; name?: string };
    if (first?.original_url) img = first.original_url;
    else if (first?.url) img = first.url;
    else if (first?.link) img = first.link;
    else if (first?.name && (first.name.startsWith("http") || first.name.startsWith("staging/"))) img = first.name;
  } else if (raw.photo) {
    img = raw.photo;
  } else if (raw.image) {
    img = raw.image;
  } else if (raw.image_url) {
    img = raw.image_url;
  }

  if (img.startsWith("staging/")) {
    return `https://res.cloudinary.com/doyd6b6cf/image/upload/f_auto,q_auto/${img}`;
  }
  return img;
}

async function getEventData(encodedId: string): Promise<EventMetaData | null> {
  try {
    const id = decodeEventId(encodedId);
    if (!id) return null;

    console.log(`[SEO] Fetching metadata for event ID: ${id} (encoded: ${encodedId})`);

    const url = `${EVENTS_API_URL}/api/service/events/${id}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": AUTH_HEADER
      }
    });

    if (!response.ok) {
      console.warn(`[SEO] Failed to fetch event ${id}: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    const event = json.data || json;

    if (!event) return null;

    const title = event.name || event.title || "JOINER Event";
    const rawDescription = event.description || event.extra_description || "Join this event on JOINER";
    
    // Simple HTML tag removal if any
    const description = rawDescription.replace(/<[^>]*>/g, '').substring(0, 200);
    const image = getEventImage(event);

    console.log(`[SEO] Successfully parsed metadata for: ${title}`);

    return { title, description, image };
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
      const replaceMeta = (html: string, property: string, content: string, isName: boolean = false) => {
        const attr = isName ? 'name' : 'property';
        // Try to find existing tag
        const regex = new RegExp(`<meta\\s+${attr}="${property}"\\s+content=".*?"\\s*\\/?>`, 'i');
        const newTag = `<meta ${attr}="${property}" content="${content.replace(/"/g, '&quot;')}" />`;
        
        if (regex.test(html)) {
          return html.replace(regex, newTag);
        } else {
          // If not found, append to head
          return html.replace("</head>", `${newTag}\n</head>`);
        }
      };

      html = html.replace(/<title>.*?<\/title>/i, `<title>${data.title} - JOINER</title>`);
      
      html = replaceMeta(html, "og:title", data.title);
      html = replaceMeta(html, "og:description", data.description);
      html = replaceMeta(html, "og:image", data.image);
      html = replaceMeta(html, "og:url", `${req.protocol}://${req.get('host')}${req.originalUrl}`);
      
      html = replaceMeta(html, "twitter:title", data.title, true);
      html = replaceMeta(html, "twitter:description", data.description, true);
      html = replaceMeta(html, "twitter:image", data.image, true);
      
      return html;
    }
  }

  return html;
}
