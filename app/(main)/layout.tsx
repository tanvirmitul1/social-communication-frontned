"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/store";
import { useSocket } from "@/lib/socket";
import { useMessageEvents } from "@/lib/socket/use-message-events";
import { useConversationEvents } from "@/lib/socket/use-conversation-events";
import { AppNavbar } from "@/components/shared/app-navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const socket = useSocket();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Initialize WebSocket event listeners
  useMessageEvents();
  useConversationEvents();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  // Socket will auto-connect via useSocket hook
  useEffect(() => {
    if (socket.isConnected()) {
      console.log("WebSocket connected in main layout");
    }
  }, [socket]);

  // Determine current page for navbar
  const currentPage = pathname.startsWith("/messages") ? "messages" : "feed";

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <AppNavbar currentPage={currentPage} />
      <div className="h-[calc(100vh-64px)] overflow-auto">{children}</div>
    </div>
  );
}
