/**
 * React hook for Socket.io integration
 */

"use client";

import { useEffect } from "react";
import { socketManager } from "./socket-manager";
import { authService } from "@/lib/api";

export function useSocket() {
  useEffect(() => {
    // Only connect if user is authenticated
    if (authService.isAuthenticated()) {
      socketManager.connect();
    }

    // Cleanup on unmount
    return () => {
      socketManager.disconnect();
    };
  }, []);

  return socketManager;
}
