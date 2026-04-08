"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Loader2,
  MessageSquare,
  Zap,
  Shield,
  Users,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch } from "@/lib/store";
import { setUser } from "@/lib/store/slices/auth.slice";
import { useLoginMutation } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant real-time messaging",
    desc: "Zero-latency delivery via WebSocket",
  },
  {
    icon: Shield,
    title: "Secure & private",
    desc: "Encrypted conversations you control",
  },
  {
    icon: Users,
    title: "Groups & communities",
    desc: "Stay connected with everyone",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMutation] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginMutation(data).unwrap();
      if (result) {
        dispatch(
          setUser({
            user: result.data.user,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
          })
        );
        router.push("/feed");
      }
    } catch (err: unknown) {
      if (typeof err === "string") {
        setError(err);
      } else if (err && typeof err === "object" && "data" in err) {
        const errorData = (err as { data?: { message?: string; error?: string } }).data;
        setError(errorData?.message || errorData?.error || "Login failed");
      } else if (err && typeof err === "object" && "message" in err) {
        setError((err as Error).message);
      } else {
        setError("An error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left brand panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-linear-to-br from-primary via-primary/90 to-purple-800">
        {/* Decorative blurred orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full bg-purple-400/15 blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Social</span>
        </div>

        {/* Headline + features */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-[1.1] tracking-tight">
              Connect with the
              <br />
              <span className="text-white/55">people that matter</span>
            </h2>
            <p className="mt-5 text-white/50 text-sm leading-relaxed max-w-sm">
              Real-time messaging, voice & video calls, groups, and a social feed —
              all in one beautifully designed platform.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-white/75" />
                </div>
                <div>
                  <p className="text-white/85 text-sm font-medium">{title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-white/25 text-xs">
          Join thousands of users already connected.
        </p>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Social</span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={cn(
                    "pl-10 h-11",
                    errors.email &&
                      "border-destructive focus-visible:ring-destructive/30"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn(
                    "pl-10 h-11",
                    errors.password &&
                      "border-destructive focus-visible:ring-destructive/30"
                  )}
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm shadow-sm hover:shadow-md transition-shadow"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/50">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
