import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Füge eine Hilfsfunktion für die Formatierung von Zeitstempeln hinzu
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Hilfsfunktion für MySQL-kompatible Zeitstempel
export function toMySQLTimestamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Hilfsfunktion für Upload-URLs
export function getUploadUrl(filename: string | null | undefined): string {
  if (!filename) {
    return '/uploads/placeholder.jpg';
  }
  
  // Verwende die API-Route für Upload-Dateien
  return `/api/uploads/${filename}`;
}
