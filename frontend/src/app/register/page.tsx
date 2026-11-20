"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wind, ArrowRight, ShieldCheck, UserCheck, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const conditions = [
    { id: "asthma", label: "Asthma or Bronchial Hyperactivity" },
    { id: "cardio", label: "Cardiovascular Disease / Hypertension" },
    { id: "elderly", label: "Senior Citizen (65+ years)" },
    { id: "children", label: "Young Children in Household" },
    { id: "athlete", label: "Outdoor Endurance Athlete / Runner" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-20 space-y-8">
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
          Create Your Environmental Profile
        </h1>
        <p className="text-xs text-[#A5B0BC]">
          Personalize exposure thresholds and receive tailored Gemini health advisories.
        </p>
      </div>

      {/* Module Placeholder Notice */}
      <div className="p-3.5 rounded-lg bg-[#141B23] border border-[#28C7F5]/30 flex items-center gap-2 text-xs text-[#A5B0BC] font-mono">
        <AlertTriangle className="w-4 h-4 text-[#28C7F5] flex-shrink-0" />
        <span>
          <strong className="text-[#F5F7FA]">Profile Preview:</strong> This preview showcases the vulnerability profile configuration planned for Module 05.
        </span>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC]">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Parker"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50"
            />
          </div>

          {/* Environmental Vulnerability Presets */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-mono text-[#28C7F5] font-semibold uppercase tracking-wider block">
              Vulnerability Profile Presets (Optional):
            </label>
            <p className="text-[11px] text-[#6B7A8D]">
              Select conditions so AIRWISE AI can calibrate threshold alerts.
            </p>
            <div className="space-y-2 pt-1">
              {conditions.map((c) => {
                const isChecked = selectedConditions.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCondition(c.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-[#28C7F5]/10 border-[#28C7F5]/40 text-[#F5F7FA]"
                        : "bg-[#10151B] border-white/[0.06] text-[#A5B0BC] hover:border-white/[0.15]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                        isChecked
                          ? "bg-[#28C7F5] border-[#28C7F5] text-[#080A0D]"
                          : "border-white/[0.2] bg-transparent"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs">{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {submitted && (
            <div className="p-3 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 text-xs text-[#38E0B4] font-mono">
              ✓ Registration preview validated! User models and PostgreSQL profile persistence integrate in Module 05.
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full">
            Complete Registration
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-[#A5B0BC]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#28C7F5] hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </Card>

      <div className="text-center">
        <Link href="/" className="text-xs text-[#6B7A8D] hover:text-[#A5B0BC] transition-colors">
          ← Back to AIRWISE AI Homepage
        </Link>
      </div>
    </div>
  );
}
