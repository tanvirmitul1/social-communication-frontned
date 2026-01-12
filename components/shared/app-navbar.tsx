"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAppSelector, useAppDispatch } from "@/lib/store";
import { clearAuth } from "@/lib/store/slices/auth.slice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bell, Home, Sun, Moon, LogOut, Settings, User } from "lucide-react";
import { getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface AppNavbarProps {
  currentPage?: "feed" | "messages";
}

export function AppNavbar({ currentPage }: AppNavbarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.messages);

  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so we can safely show the theme toggle
  useState(() => {
    setMounted(true);
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 glass backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/feed")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent hidden sm:inline">
                Social
              </span>
            </button>
          </div>

          {/* Right side - Navigation and Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Main Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Button
                variant={currentPage === "feed" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => router.push("/feed")}
                className={cn(
                  "gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3",
                  currentPage === "feed"
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50"
                    : "hover:bg-muted/50"
                )}
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Feed</span>
              </Button>
              <Button
                variant={currentPage === "messages" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => router.push("/messages")}
                className={cn(
                  "gap-1 sm:gap-2 transition-all duration-200 relative text-xs sm:text-sm px-2 sm:px-3",
                  currentPage === "messages"
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50"
                    : "hover:bg-muted/50"
                )}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="hover:bg-muted/50 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted/50 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                        {getInitials(user?.username || "User")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(`/profile/${user?.id}`)}
                    className="cursor-pointer gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
