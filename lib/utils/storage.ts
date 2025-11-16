/**
 * LocalStorage utilities with SSR safety
 */

export const storage = {
  get: <T = string>(key: string): T | null => {
    if (typeof window === "undefined") return null;

    try {
      const item = window.localStorage.getItem(key);
      if (!item) return null;

      // Try to parse JSON, if it fails return as string
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as T;
      }
    } catch (error) {
      console.error(`Error reading from localStorage (key: ${key}):`, error);
      return null;
    }
  },

  set: <T = unknown>(key: string, value: T): boolean => {
    if (typeof window === "undefined") return false;

    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (key: ${key}):`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    if (typeof window === "undefined") return false;

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (typeof window === "undefined") return false;

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return false;
    }
  },

  has: (key: string): boolean => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(key) !== null;
  },
};

export const sessionStorage = {
  get: <T = string>(key: string): T | null => {
    if (typeof window === "undefined") return null;

    try {
      const item = window.sessionStorage.getItem(key);
      if (!item) return null;

      try {
        return JSON.parse(item) as T;
      } catch {
        return item as T;
      }
    } catch (error) {
      console.error(`Error reading from sessionStorage (key: ${key}):`, error);
      return null;
    }
  },

  set: <T = unknown>(key: string, value: T): boolean => {
    if (typeof window === "undefined") return false;

    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      window.sessionStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error writing to sessionStorage (key: ${key}):`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    if (typeof window === "undefined") return false;

    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from sessionStorage (key: ${key}):`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (typeof window === "undefined") return false;

    try {
      window.sessionStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
      return false;
    }
  },

  has: (key: string): boolean => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(key) !== null;
  },
};
