// User Types
export type UserRole = "USER" | "ADMIN" | "MODERATOR";

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  statusMessage?: string | null;
  role: UserRole;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

// Message Types
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "VOICE" | "VIDEO";
export type MessageStatus = "SENT" | "DELIVERED" | "SEEN" | "FAILED";

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string | null;
  groupId?: string | null;
  content: string;
  type: MessageType;
  status: MessageStatus;
  parentId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  sender?: User;
  reactions?: MessageReaction[];
  isEdited?: boolean;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: User;
}

export interface SendMessagePayload {
  content: string;
  type: MessageType;
  receiverId?: string;
  groupId?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

// Group Types
export type GroupType = "PRIVATE" | "PUBLIC" | "SECRET";
export type GroupMemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Group {
  id: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  type: GroupType;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  user?: User;
}

export interface CreateGroupPayload {
  title: string;
  description?: string;
  cover?: string;
  type: GroupType;
}

// Call Types
export type CallType = "AUDIO" | "VIDEO";
export type CallStatus = "RINGING" | "ONGOING" | "ENDED" | "REJECTED" | "MISSED";

export interface Call {
  id: string;
  initiatorId: string;
  roomId: string;
  type: CallType;
  status: CallStatus;
  groupId?: string | null;
  createdAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  initiator?: User;
  participants?: CallParticipant[];
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string | null;
  user?: User;
}

export interface InitiateCallPayload {
  type: CallType;
  participantIds: string[];
  groupId?: string;
}

export interface JitsiCallData {
  call: Call;
  roomUrl: string;
  token: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  type: "direct" | "group";
  title: string;
  avatar: string | null;
  participants: string[]; // Array of user IDs
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isSent: boolean;
    status: MessageStatus;
  } | null;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
  updatedAt: string;
}

// Auth Types
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

// WebSocket Event Types
export interface TypingPayload {
  userId: string;
  groupId?: string;
  receiverId?: string;
}

export interface OnlineStatusPayload {
  userId: string;
}

// UI State Types
export interface ChatState {
  activeConversationId: string | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
}

export interface CallState {
  activeCall: Call | null;
  incomingCall: Call | null;
  callHistory: Call[];
  isLoading: boolean;
  error: string | null;
}

export interface UserState {
  currentUser: User | null;
  users: Record<string, User>;
  onlineUsers: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// Theme Types
export type Theme = "light" | "dark" | "system";

// Friend Request Types
export type FriendRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
}

export interface SendFriendRequestPayload {
  receiverId: string;
}

// Chat List Types
export interface ChatListResponse {
  type: "direct" | "group";
  user?: User;
  group?: Group;
  lastMessage?: Message;
  unreadCount: number;
  lastMessageAt: string;
}

// Utility Types
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
