"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api";
import { MessageCircle, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (authService.isAuthenticated()) {
      router.replace("/messages");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-12 h-12 text-primary-foreground animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Social Communication</h1>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
      </div>
    </div>
  );
}
