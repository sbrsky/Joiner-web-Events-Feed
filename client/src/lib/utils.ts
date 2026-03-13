import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBroadLocation = (fullLoc: string) => {
  if (!fullLoc || fullLoc === "TBA") return "TBA";
  const parts = fullLoc.split(',').map(p => p.trim()).filter(p => p && p.toUpperCase() !== "TBA");

  if (parts.length === 0) return "TBA";

  if (parts.length > 2) {
    // Take up to 3 segments from the end (District, City, Country)
    return parts.slice(-3).join(', ');
  }
  return parts.join(', ');
};
