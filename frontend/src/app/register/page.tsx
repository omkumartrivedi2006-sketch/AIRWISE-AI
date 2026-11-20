"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wind, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live Password Strength Requirements
  const hasMinLength = password.length >= 12;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+\\/~`]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    fullName.trim().length >= 2 &&
    email.trim().length > 0 &&
    hasMinLength &&
    hasLower &&
    hasUpper &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch &&
    agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setIsLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please verify your details.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#28C7F5] to-[#38E0B4] flex items-center justify-center shadow-cyan-glow">
            <Wind className="w-5 h-5 text-[#080A0D]" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#F5F7FA]">
            AIRWISE<span className="text-[#28C7F5]">.AI</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-[#F5F7FA] mt-4">
          Create Your AIRWISE Account
        </h1>
        <p className="text-xs text-[#A5B0BC]">
          Join AIRWISE AI and explore a smarter way to understand pollution.
        </p>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5">
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 flex flex-col items-center text-center gap-2 text-xs text-[#38E0B4] font-mono">
            <CheckCircle2 className="w-6 h-6 text-[#38E0B4]" />
            <span className="font-bold text-sm">Account Created Successfully!</span>
            <span>A verification token has been issued. Redirecting you to sign in...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#28C7F5]" />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Elena Rostova"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#28C7F5]" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@university.edu"
                required
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#38E0B4]" />
                Password (Argon2id Encrypted)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  required
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] hover:text-[#F5F7FA] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirement Checklist */}
              <div className="p-3 rounded-lg bg-[#10151B] border border-white/[0.06] grid grid-cols-2 gap-1.5 text-[11px] font-mono mt-2">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> 12+ Characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Uppercase (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Lowercase (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Numeric Digit (0-9)
                </div>
                <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? "text-[#38E0B4]" : "text-[#6B7A8D]"}`}>
                  <Check className="w-3.5 h-3.5" /> Special Symbol (!@#$%^&*)
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A5B0BC] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#38E0B4]" />
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                disabled={isLoading}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none disabled:opacity-50 ${
                  confirmPassword && !passwordsMatch
                    ? "border-rose-500/50 focus:border-rose-500"
                    : "border-white/[0.09] focus:border-[#28C7F5]/50"
                }`}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] font-mono text-rose-400">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-[#10151B] border-white/[0.12] text-[#28C7F5] focus:ring-0"
              />
              <label htmlFor="terms" className="text-xs text-[#A5B0BC] leading-relaxed">
                I acknowledge the{" "}
                <Link href="/terms" className="text-[#28C7F5] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#28C7F5] hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-[#A5B0BC]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#28C7F5] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
