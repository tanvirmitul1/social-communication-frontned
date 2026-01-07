/**
 * Formatting utilities
 */

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

/**
 * Format date for message timestamps
 * - Shows time if today
 * - Shows "Yesterday" if yesterday
 * - Shows date otherwise
 */
export function formatMessageDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (isToday(dateObj)) {
    return format(dateObj, "p"); // 12:00 PM
  }

  if (isYesterday(dateObj)) {
    return "Yesterday";
  }

  return format(dateObj, "PP"); // Jan 1, 2023
}

/**
 * Format time for message timestamps
 */
export function formatMessageTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "p"); // 12:00 PM
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format last seen time for user presence
 */
export function formatLastSeen(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (isToday(dateObj)) {
    return `Last seen today at ${format(dateObj, "p")}`;
  }

  if (isYesterday(dateObj)) {
    return `Last seen yesterday at ${format(dateObj, "p")}`;
  }

  return `Last seen ${formatDistanceToNow(dateObj, { addSuffix: true })}`;
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Get initials from name
 */
export function getInitials(name?: string): string {
  if (!name) {
    return "?";
  }
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Format count (e.g., 1K, 1.2M)
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Pluralize word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}
