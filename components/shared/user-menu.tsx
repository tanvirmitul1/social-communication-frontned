"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { logout as logoutAction } from "@/lib/store/slices/auth.slice";
import { authService } from "@/lib/api";
import { socketManager } from "@/lib/socket/socket-manager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { getInitials } from "@/lib/utils/format";

export function UserMenu() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      // Call logout API
      await authService.logout();

      // Disconnect WebSocket
      socketManager.disconnect();

      // Clear Redux state
      dispatch(logoutAction());

      // Redirect to login
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API fails, still log out locally
      socketManager.disconnect();
      dispatch(logoutAction());
      router.replace("/login");
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden text-left">
            <p className="truncate font-semibold">{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.statusMessage || "Available"}
            </p>
          </div>
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
