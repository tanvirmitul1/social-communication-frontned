"use client";

import { useEffect, useState } from "react";
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
import {
  MessageSquare,
  Bell,
  Home,
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
} from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const handleLogout = () => {
    dispatch(clearAuth());
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 glass">
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">

          {/* ─── Logo ─── */}
          <button
            onClick={() => router.push("/feed")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            aria-label="Go to feed"
          >
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm shrink-0">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight hidden sm:inline">
              Social
            </span>
          </button>

          {/* ─── Right cluster ─── */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Navigation pills */}
            <nav className="flex items-center gap-0.5 sm:gap-1 mr-1 sm:mr-2">
              <NavButton
                label="Feed"
                icon={<Home className="h-4 w-4" />}
                active={currentPage === "feed"}
                onClick={() => router.push("/feed")}
              />
              <NavButton
                label="Messages"
                icon={<MessageSquare className="h-4 w-4" />}
                active={currentPage === "messages"}
                onClick={() => router.push("/messages")}
              />
            </nav>

            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 hover:bg-muted/60 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                )}
              </Button>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-muted/60 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {/* Unread dot — replace with dynamic count when API ready */}
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/25 transition-all"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                      {getInitials(user?.username || "User")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 glass">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      {user?.email}
                    </p>
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
    </header>
  );
}

/* ─── NavButton ─── */
interface NavButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function NavButton({ label, icon, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "text-primary bg-primary/8"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {/* Active underline indicator */}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
      )}
    </button>
  );
}
