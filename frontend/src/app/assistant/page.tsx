"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bot, Send, Sparkles, User, ShieldCheck, CheckCircle2, CornerDownRight, AlertTriangle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your AIRWISE AI Environmental Assistant. How can I help you understand your local air quality or health precautions today?",
      timestamp: "10:00 AM",
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, timestamp: "Just now" },
      {
        sender: "ai",
        text: `AIRWISE AI Environmental Intelligence Response: Received query regarding "${userText}". In Module 03, this conversation interfaces directly with our server-side Google Gemini 1.5 service, grounded in WHO/EPA standards.`,
        timestamp: "Just now",
      },
    ]);
    setInputValue("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.09] gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg bg-[#141B23] border border-white/[0.09] text-[#A5B0BC] hover:text-[#F5F7FA]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F7FA]">
                AIRWISE AI Assistant
              </h1>
              <Badge variant="cyan" size="sm">
                Dedicated View
              </Badge>
            </div>
            <p className="text-xs text-[#A5B0BC]">
              Grounded environmental guidance and pollution health advisory companion.
            </p>
          </div>
        </div>

        <Badge variant="outline" size="sm" className="font-mono text-xs text-amber-400 border-amber-500/30">
          Module 02 UI Preview
        </Badge>
      </div>

      {/* Main Conversation Container */}
      <Card className="p-0 overflow-hidden bg-[#10151B] border-white/[0.09] shadow-2xl">
        <div className="p-4 bg-[#141B23] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <span className="text-[#28C7F5] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Conversation Interface Shell
          </span>
          <span className="text-[#6B7A8D]">Server-side integration: Module 03</span>
        </div>

        {/* Message Feed */}
        <div className="p-6 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                m.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.sender === "ai" && (
                <div className="w-8 h-8 rounded-lg bg-[#141B23] border border-white/[0.09] flex items-center justify-center text-[#28C7F5] flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#28C7F5]/10 text-[#F5F7FA] border border-[#28C7F5]/30"
                    : "bg-[#141B23] text-[#F5F7FA] border border-white/[0.08]"
                }`}
              >
                <p>{m.text}</p>
                <span className="block mt-1 text-[10px] font-mono text-[#6B7A8D] text-right">
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-[#141B23] border-t border-white/[0.09] flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your environmental question..."
            className="flex-grow px-4 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50"
          />
          <Button type="submit" variant="primary" size="md">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
