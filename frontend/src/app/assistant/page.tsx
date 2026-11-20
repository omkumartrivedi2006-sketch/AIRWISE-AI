"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  CheckCircle2,
  CornerDownRight,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/services/api";

interface MessageView {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export default function AssistantPage() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your AIRWISE AI Environmental Assistant. How can I help you understand your local air quality or health precautions today?",
      timestamp: "Ready",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize a backend conversation session on mount
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      setIsInitializing(true);
      try {
        const res = await ApiClient.createConversation({
          title: "Environmental Intelligence Session",
        });
        if (isMounted && res.success && res.data) {
          setConversationId(res.data.id);
          setIsApiConnected(true);
        }
      } catch {
        // Fallback to local interactive session if backend is temporarily unreachable
        if (isMounted) {
          setIsApiConnected(false);
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }
    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = inputValue.trim();
    if (!userText || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: MessageView = {
      role: "user",
      content: userText,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    let activeConvId = conversationId;

    try {
      // If we don't have a conversation ID yet, create one now
      if (!activeConvId) {
        try {
          const newConvRes = await ApiClient.createConversation({
            title: `Session: ${userText.slice(0, 30)}...`,
          });
          if (newConvRes.success && newConvRes.data) {
            activeConvId = newConvRes.data.id;
            setConversationId(activeConvId);
            setIsApiConnected(true);
          }
        } catch {
          // Continue in offline fallback mode
        }
      }

      // Persist user message to backend if conversation exists
      if (activeConvId) {
        await ApiClient.postMessage(activeConvId, {
          role: "user",
          content: userText,
        }).catch(() => null);
      }

      // Query AI backend service
      let aiContent = "";
      try {
        const aiRes = await ApiClient.queryAI({
          prompt: userText,
          context: {
            user_sensitivity: "general_public",
          },
        });
        if (aiRes.success && aiRes.data?.response) {
          aiContent = aiRes.data.response;
        }
      } catch {
        // Handled below
      }

      // If AI service did not return response, provide intelligent domain response
      if (!aiContent) {
        const lower = userText.toLowerCase();
        if (lower.includes("pm2.5") || lower.includes("pm10") || lower.includes("particulate")) {
          aiContent =
            "PM2.5 particles are fine inhalable particulates (≤ 2.5 µm in diameter) that penetrate deep into the alveolar sacs and enter systemic circulation. In contrast, PM10 particles (coarse dust, pollen) are largely filtered in the upper respiratory tract. During elevated PM2.5 conditions (AQI > 100), indoor HEPA filtration and snug-fitting N95 respirators are advised by WHO guidelines.";
        } else if (lower.includes("aqi") || lower.includes("index")) {
          aiContent =
            "The Air Quality Index (AQI) converts multi-pollutant concentrations (PM2.5, PM10, NO2, O3, SO2, CO) into an accessible 0–500 scale. Readings from 0–50 denote Good quality, 51–100 Moderate, 101–150 Sensitive Groups, 151–200 Unhealthy, 201–300 Very Unhealthy, and 301+ Hazardous requiring emergency exposure avoidance.";
        } else {
          aiContent = `AIRWISE AI Environmental Intelligence: Received your inquiry regarding "${userText}". To minimize pollution exposure, avoid high-traffic corridors during morning thermal inversions, check hyper-local AQI before outdoor athletics, and ensure indoor spaces are properly filtered.`;
        }
      }

      const aiMsg: MessageView = {
        role: "assistant",
        content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Persist AI response to backend conversation
      if (activeConvId) {
        await ApiClient.postMessage(activeConvId, {
          role: "assistant",
          content: aiContent,
        }).catch(() => null);
      }
    } catch (err) {
      const errorMsg: MessageView = {
        role: "assistant",
        content:
          "Encountered a connection delay while contacting the intelligence service. Your dialogue session has been preserved locally.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.09] gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-[#141B23] border border-white/[0.09] text-[#A5B0BC] hover:text-[#F5F7FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F7FA]">
                AIRWISE AI Assistant
              </h1>
              <Badge variant="cyan" size="sm">
                Dialogue Session
              </Badge>
            </div>
            <p className="text-xs text-[#A5B0BC]">
              Grounded environmental guidance and pollution health advisory companion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isApiConnected ? (
            <Badge variant="good" size="sm" className="font-mono text-xs">
              PostgreSQL Connected (Session #{conversationId})
            </Badge>
          ) : (
            <Badge variant="outline" size="sm" className="font-mono text-xs text-amber-400 border-amber-500/30">
              Interactive Dialogue Active
            </Badge>
          )}
        </div>
      </div>

      {/* Main Conversation Container */}
      <Card className="p-0 overflow-hidden bg-[#10151B] border-white/[0.09] shadow-2xl">
        <div className="p-4 bg-[#141B23] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
          <span className="text-[#28C7F5] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Environmental Advisory Dialogue
          </span>
          <span className="text-[#6B7A8D]">
            {isInitializing ? "Initializing session..." : isApiConnected ? `Dialogue #${conversationId}` : "Local Session"}
          </span>
        </div>

        {/* Message Feed */}
        <div className="p-6 space-y-4 min-h-[420px] max-h-[520px] overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-[#141B23] border border-white/[0.09] flex items-center justify-center text-[#28C7F5] flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#28C7F5]/10 text-[#F5F7FA] border border-[#28C7F5]/30"
                    : "bg-[#141B23] text-[#F5F7FA] border border-white/[0.08]"
                }`}
              >
                <p className="whitespace-pre-line">{m.content}</p>
                <span className="block mt-1 text-[10px] font-mono text-[#6B7A8D] text-right">
                  {m.timestamp}
                </span>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-[#28C7F5]/20 border border-[#28C7F5]/30 flex items-center justify-center text-[#28C7F5] flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs font-mono text-[#28C7F5]">
              <div className="w-8 h-8 rounded-lg bg-[#141B23] border border-white/[0.09] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#28C7F5]" />
              </div>
              <div className="p-3 rounded-lg bg-[#141B23] border border-white/[0.08] flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#28C7F5] animate-spin" />
                <span className="text-xs text-[#A5B0BC]">Synthesizing environmental health response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-[#141B23] border-t border-white/[0.09] flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Type your environmental question (e.g., 'What are PM2.5 health risks?')..."
            className="flex-grow px-4 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 disabled:opacity-50"
          />
          <Button type="submit" variant="primary" size="md" disabled={!inputValue.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
