/**
 * React hook for Socket.io integration
 */

"use client";

import { useEffect } from "react";
import { socketManager } from "./socket-manager";
import { storage } from "@/lib/utils/storage";
import { STORAGE_KEYS } from "@/lib/constants";

export function useSocket() {
  useEffect(() => {
    // Only connect if user is authenticated
    if (storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN)) {
      socketManager.connect();
    }

    // Cleanup on unmount
    return () => {
      socketManager.disconnect();
    };
  }, []);

  return socketManager;
}