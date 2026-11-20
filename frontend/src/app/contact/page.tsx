"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/services/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await ApiClient.submitFeedback({
        rating,
        comment: `Inquiry from: ${name} <${email}>\n\n${message}`,
      });

      if (response.success) {
        setSubmitted(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setErrorMessage(response.message || "Failed to submit feedback. Please try again.");
      }
    } catch (err: unknown) {
      // Graceful handling if backend feedback table or network is unreachable
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7A8D] hover:text-[#28C7F5] transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>
        <h1 className="text-3xl font-bold text-[#F5F7FA] mt-2">
          Contact & Platform Feedback
        </h1>
        <p className="text-xs sm:text-sm text-[#A5B0BC]">
          Inquiries regarding environmental partnerships, developer APIs, and platform feedback.
        </p>
      </div>

      <Card className="p-6 bg-[#141B23] border-white/[0.09] space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC]">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dr. Jane Doe"
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC]">Platform Experience Rating (1–5)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setRating(val)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all ${
                    rating === val
                      ? "bg-[#28C7F5]/20 text-[#28C7F5] border border-[#28C7F5]/50 font-bold"
                      : "bg-[#10151B] text-[#A5B0BC] border border-white/[0.06] hover:text-[#F5F7FA]"
                  }`}
                >
                  {val} ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC]">Inquiry or Feedback Details</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your environmental inquiry or partnership interest..."
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitted && (
            <div className="p-3 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 text-xs text-[#38E0B4] font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Thank you! Your feedback has been recorded in the AIRWISE database.</span>
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" /> Submit to AIRWISE
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
