import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(name: string): string {
  // Using DiceBear for consistent, deterministic avatar generation
  const sanitizedName = encodeURIComponent(name.toLowerCase());
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${sanitizedName}&backgroundColor=b6e3f4`;
}