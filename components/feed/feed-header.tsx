"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { useLogoutMutation } from "@/lib/api";
import { clearAuth } from "@/lib/store/slices/auth.slice";
import { socketManager } from "@/lib/socket/socket-manager";
import { storage } from "@/lib/utils/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageCircle, Settings, LogOut, User, Sparkles } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { toast } from "sonner";

export function FeedHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();
  const [notificationCount] = useState(3); // Mock notification count

  const handleLogout = async () => {
    try {
      // Disconnect WebSocket
      socketManager.disconnect();

      // Get refresh token from storage
      const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);

      // Call logout API with refresh token
      if (refreshToken) {
        await logoutMutation(refreshToken).unwrap();
      }

      // Clear Redux state
      dispatch(clearAuth());

      toast.success("Logged out successfully");
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API fails, still log out locally
      socketManager.disconnect();
      dispatch(clearAuth());
      toast.success("Logged out successfully");
      router.replace("/login");
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Navigation & User Menu */}
        <div className="flex items-center gap-4">
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/messages")}
            className="relative"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Messages</span>
          </Button>

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Notifications</span>
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 border-2 border-background">
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.username}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
