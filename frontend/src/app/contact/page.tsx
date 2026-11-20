"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#6B7A8D] hover:text-[#28C7F5] transition-colors font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>
        <h1 className="text-3xl font-bold text-[#F5F7FA] mt-2">
          Contact AIRWISE AI
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
              placeholder="Name"
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
              placeholder="email@domain.com"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#A5B0BC]">Inquiry Details</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your environmental inquiry or partnership interest..."
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50"
            />
          </div>

          {submitted && (
            <div className="p-3 rounded-lg bg-[#38E0B4]/10 border border-[#38E0B4]/30 text-xs text-[#38E0B4] font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Thank you! Your inquiry has been recorded in the platform preview queue.</span>
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full">
            <Send className="w-4 h-4 mr-1.5" /> Submit Inquiry
          </Button>
        </form>
      </Card>
    </div>
  );
}
