"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { useMessageEvents } from "@/lib/socket/use-message-events";
import { useConversationEvents } from "@/lib/socket/use-conversation-events";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const socket = useSocket();

  // Initialize WebSocket event listeners
  useMessageEvents();
  useConversationEvents();

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  // Socket will auto-connect via useSocket hook
  useEffect(() => {
    if (socket.isConnected()) {
      console.log("WebSocket connected in main layout");
    }
  }, [socket]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
