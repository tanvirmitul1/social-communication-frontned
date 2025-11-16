/**
 * WebSocket Manager using Socket.io
 * Handles real-time communication with the server
 */

import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";
import { WS_EVENTS, STORAGE_KEYS } from "@/lib/constants";
import { storage } from "@/lib/utils/storage";
import type {
  Message,
  SendMessagePayload,
  TypingPayload,
  OnlineStatusPayload,
  Call,
  InitiateCallPayload,
  JitsiCallData,
} from "@/types";

type EventCallback = (...args: unknown[]) => void;

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.warn("Socket already connected");
      return;
    }

    const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);

    if (!token) {
      console.error("No access token available for WebSocket connection");
      return;
    }

    this.socket = io(env.api.wsUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupDefaultListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Setup default event listeners
   */
  private setupDefaultListeners(): void {
    if (!this.socket) return;

    this.socket.on(WS_EVENTS.CONNECT, () => {
      console.log("✅ WebSocket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on(WS_EVENTS.DISCONNECT, () => {
      console.log("❌ WebSocket disconnected");
    });

    this.socket.on(WS_EVENTS.ERROR, (error: { message: string }) => {
      console.error("WebSocket error:", error);
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        this.disconnect();
      }
    });
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: EventCallback): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.listeners.get(event)?.clear();
      this.socket?.off(event);
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.error("Socket not connected. Cannot emit event:", event);
      return;
    }

    this.socket.emit(event, data);
  }

  // ==================== Message Events ====================

  /**
   * Send a message via WebSocket
   */
  sendMessage(payload: SendMessagePayload): void {
    this.emit(WS_EVENTS.MESSAGE_SEND, payload);
  }

  /**
   * Listen for new messages
   */
  onMessageReceived(callback: (message: Message) => void): void {
    this.on(WS_EVENTS.MESSAGE_RECEIVED, callback as EventCallback);
  }

  /**
   * Listen for message sent confirmation
   */
  onMessageSent(callback: (message: Message) => void): void {
    this.on(WS_EVENTS.MESSAGE_SENT, callback as EventCallback);
  }

  /**
   * Listen for message edits
   */
  onMessageEdit(callback: (message: Message) => void): void {
    this.on(WS_EVENTS.MESSAGE_EDIT, callback as EventCallback);
  }

  /**
   * Listen for message deletions
   */
  onMessageDelete(callback: (data: { messageId: string }) => void): void {
    this.on(WS_EVENTS.MESSAGE_DELETE, callback as EventCallback);
  }

  /**
   * Edit a message
   */
  editMessage(messageId: string, content: string): void {
    this.emit(WS_EVENTS.MESSAGE_EDIT, { messageId, content });
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): void {
    this.emit(WS_EVENTS.MESSAGE_DELETE, { messageId });
  }

  // ==================== Typing Events ====================

  /**
   * Start typing indicator
   */
  startTyping(payload: Omit<TypingPayload, "userId">): void {
    this.emit(WS_EVENTS.TYPING_START, payload);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(payload: Omit<TypingPayload, "userId">): void {
    this.emit(WS_EVENTS.TYPING_STOP, payload);
  }

  /**
   * Listen for typing start
   */
  onTypingStart(callback: (data: TypingPayload) => void): void {
    this.on(WS_EVENTS.TYPING_START, callback as EventCallback);
  }

  /**
   * Listen for typing stop
   */
  onTypingStop(callback: (data: TypingPayload) => void): void {
    this.on(WS_EVENTS.TYPING_STOP, callback as EventCallback);
  }

  // ==================== Call Events ====================

  /**
   * Initiate a call
   */
  initiateCall(payload: InitiateCallPayload): void {
    this.emit(WS_EVENTS.CALL_INITIATE, payload);
  }

  /**
   * Listen for call initiation confirmation
   */
  onCallInitiate(callback: (data: JitsiCallData) => void): void {
    this.on(WS_EVENTS.CALL_INITIATE, callback as EventCallback);
  }

  /**
   * Listen for incoming call
   */
  onCallRinging(callback: (data: { call: Call; initiatorId: string }) => void): void {
    this.on(WS_EVENTS.CALL_RINGING, callback as EventCallback);
  }

  /**
   * Answer a call
   */
  answerCall(callId: string): void {
    this.emit(WS_EVENTS.CALL_ANSWER, { callId });
  }

  /**
   * Listen for call answer
   */
  onCallAnswer(callback: (data: JitsiCallData) => void): void {
    this.on(WS_EVENTS.CALL_ANSWER, callback as EventCallback);
  }

  /**
   * Reject a call
   */
  rejectCall(callId: string): void {
    this.emit(WS_EVENTS.CALL_REJECT, { callId });
  }

  /**
   * Listen for call rejection
   */
  onCallReject(callback: (data: { callId: string; userId: string }) => void): void {
    this.on(WS_EVENTS.CALL_REJECT, callback as EventCallback);
  }

  /**
   * End a call
   */
  endCall(callId: string): void {
    this.emit(WS_EVENTS.CALL_END, { callId });
  }

  /**
   * Listen for call end
   */
  onCallEnd(callback: (data: { callId: string }) => void): void {
    this.on(WS_EVENTS.CALL_END, callback as EventCallback);
  }

  /**
   * Leave a call
   */
  leaveCall(callId: string): void {
    this.emit(WS_EVENTS.CALL_PARTICIPANT_LEAVE, { callId });
  }

  /**
   * Listen for participant join
   */
  onParticipantJoin(callback: (data: { callId: string; userId: string }) => void): void {
    this.on(WS_EVENTS.CALL_PARTICIPANT_JOIN, callback as EventCallback);
  }

  /**
   * Listen for participant leave
   */
  onParticipantLeave(callback: (data: { callId: string; userId: string }) => void): void {
    this.on(WS_EVENTS.CALL_PARTICIPANT_LEAVE, callback as EventCallback);
  }

  // ==================== Presence Events ====================

  /**
   * Listen for user online status
   */
  onUserOnline(callback: (data: OnlineStatusPayload) => void): void {
    this.on(WS_EVENTS.USER_ONLINE, callback as EventCallback);
  }

  /**
   * Listen for user offline status
   */
  onUserOffline(callback: (data: OnlineStatusPayload) => void): void {
    this.on(WS_EVENTS.USER_OFFLINE, callback as EventCallback);
  }

  /**
   * Clean up all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.socket?.removeAllListeners(event);
    } else {
      this.listeners.clear();
      this.socket?.removeAllListeners();
      this.setupDefaultListeners(); // Re-setup default listeners
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
