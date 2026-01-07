/**
 * Application constants
 */

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    LOGOUT_ALL: "/auth/logout-all",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
  },
  USERS: {
    BASE: "/users",
    BY_ID: (id: string) => `/users/${id}`,
    SEARCH: "/users",
    PRESENCE: (id: string) => `/users/${id}/presence`,
  },
  FRIEND_REQUESTS: {
    BASE: "/users/friend-requests",
    SEND: "/users/friend-requests",
    ACCEPT: (id: string) => `/users/friend-requests/${id}/accept`,
    REJECT: (id: string) => `/users/friend-requests/${id}/reject`,
    CANCEL: (id: string) => `/users/friend-requests/${id}/cancel`,
    PENDING: "/users/friend-requests/pending",
  },
  FRIENDS: {
    BASE: "/friends",
    LIST: "/friends",
    REMOVE: (id: string) => `/friends/${id}`,
  },
  MESSAGES: {
    BASE: "/messages",
    BY_ID: (id: string) => `/messages/${id}`,
    GROUP: (groupId: string) => `/messages/group/${groupId}`,
    DIRECT: (userId: string) => `/messages/direct/${userId}`,
    DELIVERED: (id: string) => `/messages/${id}/delivered`,
    SEEN: (id: string) => `/messages/${id}/seen`,
    REACT: (id: string) => `/messages/${id}/react`,
    SEARCH: "/messages/search",
  },
  GROUPS: {
    BASE: "/groups",
    BY_ID: (id: string) => `/groups/${id}`,
    MEMBERS: (id: string) => `/groups/${id}/members`,
    REMOVE_MEMBER: (groupId: string, userId: string) => `/groups/${groupId}/members/${userId}`,
    LEAVE: (id: string) => `/groups/${id}/leave`,
  },
  CALLS: {
    BASE: "/calls",
    BY_ID: (id: string) => `/calls/${id}`,
    JOIN: (id: string) => `/calls/${id}/join`,
    END: (id: string) => `/calls/${id}/end`,
    LEAVE: (id: string) => `/calls/${id}/leave`,
    REJECT: (id: string) => `/calls/${id}/reject`,
  },
  HEALTH: {
    BASE: "/health",
    READY: "/health/ready",
    METRICS: "/metrics",
  },
} as const;

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // Messages
  MESSAGE_SEND: "message:send",
  MESSAGE_SENT: "message:sent",
  MESSAGE_RECEIVED: "message:received",
  MESSAGE_EDIT: "message:edit",
  MESSAGE_DELETE: "message:delete",

  // Typing
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // Calls
  CALL_INITIATE: "call:initiate",
  CALL_RINGING: "call:ringing",
  CALL_ANSWER: "call:answer",
  CALL_REJECT: "call:reject",
  CALL_END: "call:end",
  CALL_PARTICIPANT_JOIN: "call:participant:join",
  CALL_PARTICIPANT_LEAVE: "call:participant:leave",

  // Presence
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
  THEME: "theme",
  SIDEBAR_STATE: "sidebar_state",
  RECENT_EMOJIS: "recent_emojis",
} as const;

// Theme
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  FILE: "FILE",
  VOICE: "VOICE",
  VIDEO: "VIDEO",
} as const;

// Call Types
export const CALL_TYPES = {
  AUDIO: "AUDIO",
  VIDEO: "VIDEO",
} as const;

// Group Types
export const GROUP_TYPES = {
  PRIVATE: "PRIVATE",
  PUBLIC: "PUBLIC",
  SECRET: "SECRET",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MESSAGES_LIMIT: 50,
} as const;

// Rate Limits (in milliseconds)
export const RATE_LIMITS = {
  TYPING_INDICATOR: 3000, // Send typing indicator max every 3 seconds
  MESSAGE_SEND: 1000, // Prevent spam, 1 message per second
  SEARCH_DEBOUNCE: 300, // Debounce search input
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_FILE_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
} as const;

// UI
export const UI = {
  SIDEBAR_WIDTH: 320,
  HEADER_HEIGHT: 64,
  MESSAGE_INPUT_HEIGHT: 120,
  AVATAR_SIZES: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },
  ANIMATION: {
    DURATION: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    EASING: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized. Please log in again.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NOT_FOUND: "Resource not found.",
  RATE_LIMIT: "Too many requests. Please slow down.",
  UNKNOWN: "An unknown error occurred.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Successfully logged in!",
  LOGOUT: "Successfully logged out!",
  REGISTER: "Account created successfully!",
  MESSAGE_SENT: "Message sent!",
  MESSAGE_DELETED: "Message deleted!",
  GROUP_CREATED: "Group created successfully!",
  PROFILE_UPDATED: "Profile updated successfully!",
} as const;

// Validation Rules
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 5000,
  },
  GROUP_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  GROUP_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  STATUS_MESSAGE: {
    MAX_LENGTH: 100,
  },
} as const;

// Date Formats
export const DATE_FORMATS = {
  FULL: "PPP p", // Jan 1, 2023, 12:00 PM
  SHORT: "PP", // Jan 1, 2023
  TIME: "p", // 12:00 PM
  RELATIVE: "relative", // 2 hours ago
  MESSAGE_TIME: "p", // 12:00 PM
  MESSAGE_DATE: "PP", // Jan 1, 2023
} as const;

// Emoji Reactions (Popular ones)
export const EMOJI_REACTIONS = [
  "👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥",
] as const;
