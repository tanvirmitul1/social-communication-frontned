"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User, Mail, Lock, Loader2, MessageSquare,
  CheckCircle2, AlertCircle, Zap, Shield, Users,
  Eye, EyeOff, ArrowRight, Check,
} from "lucide-react";
import { useAppDispatch } from "@/lib/store";
import { setUser } from "@/lib/store/slices/auth.slice";
import { useRegisterMutation } from "@/lib/api";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Zap,    title: "Start chatting instantly",  desc: "No setup required — just sign up and go" },
  { icon: Shield, title: "Your data stays yours",     desc: "Privacy-first by design" },
  { icon: Users,  title: "Bring your people",         desc: "Groups, DMs, and communities" },
];

// Password strength rules
const PASSWORD_RULES = [
  { label: "At least 8 characters",  test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",   test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",   test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",             test: (p: string) => /\d/.test(p) },
];

function getStrength(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: 0, label: "Too weak",  color: "bg-red-500" };
  if (passed === 2) return { level: 1, label: "Weak",     color: "bg-orange-500" };
  if (passed === 3) return { level: 2, label: "Good",     color: "bg-yellow-500" };
  return              { level: 3, label: "Strong",   color: "bg-green-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registerMutation] = useRegisterMutation();

  const { register, handleSubmit, watch, formState: { errors, dirtyFields } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password") || "";
  const confirmValue = watch("confirmPassword") || "";
  const strength = useMemo(() => getStrength(passwordValue), [passwordValue]);
  const passwordsMatch = passwordValue && confirmValue && passwordValue === confirmValue;

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await registerMutation({
        username: data.username,
        email: data.email,
        password: data.password,
      }).unwrap();

      dispatch(setUser({
        user: result.data.user,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      }));

      setSuccess(true);
      setTimeout(() => router.push("/feed"), 1800);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "data" in err) {
        const d = (err as { data?: { message?: string } }).data;
        setError(d?.message || "Registration failed. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">You're all set! 🎉</h2>
            <p className="text-muted-foreground text-sm">Your account has been created successfully.</p>
          </div>
          <p className="text-xs text-muted-foreground/50 animate-pulse">Taking you to your feed…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-purple-800">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 right-0 w-72 h-72 rounded-full bg-purple-400/15 blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Social</span>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-[1.1] tracking-tight">
              Your community
              <br />
              <span className="text-white/50">awaits you</span>
            </h2>
            <p className="mt-5 text-white/45 text-sm leading-relaxed max-w-sm">
              Sign up in seconds and start connecting with the people and groups that matter most to you.
            </p>
          </div>
          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-white/70" />
                </div>
                <div>
                  <p className="text-white/85 text-sm font-medium">{title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/25 text-xs">Free forever for personal use.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12 bg-background overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-6 my-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Social</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground text-sm">Get started — it&apos;s completely free</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Global error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <div className="relative">
                <User className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
                  errors.username ? "text-destructive" : dirtyFields.username && !errors.username ? "text-green-500" : "text-muted-foreground"
                )} />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  autoComplete="username"
                  {...register("username")}
                  className={cn(
                    "pl-10 h-11 transition-colors",
                    errors.username && "border-destructive focus-visible:ring-destructive/30",
                    dirtyFields.username && !errors.username && "border-green-500/50 focus-visible:ring-green-500/20"
                  )}
                />
                {dirtyFields.username && !errors.username && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                )}
              </div>
              {errors.username ? (
                <p className="text-destructive text-xs flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="h-3 w-3" />{errors.username.message}
                </p>
              ) : (
                <p className="text-muted-foreground/50 text-xs">Letters, numbers, and underscores only</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
                  errors.email ? "text-destructive" : dirtyFields.email && !errors.email ? "text-green-500" : "text-muted-foreground"
                )} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  className={cn(
                    "pl-10 h-11 transition-colors",
                    errors.email && "border-destructive focus-visible:ring-destructive/30",
                    dirtyFields.email && !errors.email && "border-green-500/50 focus-visible:ring-green-500/20"
                  )}
                />
                {dirtyFields.email && !errors.email && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                )}
              </div>
              {errors.email && (
                <p className="text-destructive text-xs flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="h-3 w-3" />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
                  errors.password ? "text-destructive" : "text-muted-foreground"
                )} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password")}
                  className={cn(
                    "pl-10 pr-11 h-11 transition-colors",
                    errors.password && "border-destructive focus-visible:ring-destructive/30"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength meter */}
              {passwordValue.length > 0 && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i <= strength.level ? strength.color : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium",
                      strength.level === 0 && "text-red-500",
                      strength.level === 1 && "text-orange-500",
                      strength.level === 2 && "text-yellow-500",
                      strength.level === 3 && "text-green-500",
                    )}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {PASSWORD_RULES.map((rule) => (
                      <div key={rule.label} className={cn(
                        "flex items-center gap-1.5 text-xs transition-colors",
                        rule.test(passwordValue) ? "text-green-500" : "text-muted-foreground/60"
                      )}>
                        <Check className={cn("h-3 w-3 shrink-0", !rule.test(passwordValue) && "opacity-30")} />
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && !passwordValue && (
                <p className="text-destructive text-xs flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="h-3 w-3" />{errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
              <div className="relative">
                <Lock className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
                  errors.confirmPassword ? "text-destructive" : passwordsMatch ? "text-green-500" : "text-muted-foreground"
                )} />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className={cn(
                    "pl-10 pr-11 h-11 transition-colors",
                    errors.confirmPassword && "border-destructive focus-visible:ring-destructive/30",
                    passwordsMatch && "border-green-500/50 focus-visible:ring-green-500/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-destructive text-xs flex items-center gap-1 animate-in fade-in duration-150">
                  <AlertCircle className="h-3 w-3" />{errors.confirmPassword.message}
                </p>
              ) : passwordsMatch ? (
                <p className="text-green-500 text-xs flex items-center gap-1 animate-in fade-in duration-150">
                  <Check className="h-3 w-3" />Passwords match
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm group"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
              ) : (
                <>Create account <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/50">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
