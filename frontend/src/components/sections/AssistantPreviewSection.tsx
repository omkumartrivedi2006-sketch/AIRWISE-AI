"use client";

import React, { useState } from "react";
import { Bot, Send, Sparkles, User, ShieldCheck, CheckCircle2, CornerDownRight, AlertTriangle } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  insights?: {
    severity: string;
    precautions: string[];
  };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    sender: "user",
    text: "What is the difference between PM2.5 and PM10, and which one is more hazardous to human health?",
    timestamp: "10:14 AM",
  },
  {
    sender: "ai",
    text: "PM2.5 and PM10 are particulate matter classifications defined by aerodynamic diameter:\n\n• PM10 (≤ 10 µm): Coarse particles such as road dust, silica, and pollen. These deposit primarily in the nasal cavity and upper respiratory tract.\n• PM2.5 (≤ 2.5 µm): Fine combustion particles from vehicles, industrial boilers, and biomass burning. Because of their microscopic size, PM2.5 bypasses upper airway cilia, reaches deep pulmonary alveoli, and can cross into the bloodstream.\n\nHealth Conclusion: PM2.5 is significantly more hazardous, causing systemic oxidative stress, chronic airway remodeling, and cardiovascular plaque destabilization.",
    timestamp: "10:14 AM",
    insights: {
      severity: "High Clinical Relevance",
      precautions: [
        "Use certified N95 / FFP2 respirators during high PM2.5 events (surgical masks do not filter fine particulates).",
        "Deploy True HEPA (H13/H14) indoor air filtration with tight door/window seals.",
      ],
    },
  },
];

const SUGGESTED_QUESTIONS = [
  "What is AQI?",
  "What causes PM2.5 pollution?",
  "How can I reduce exposure to polluted air?",
  "Explain the difference between PM2.5 and PM10.",
];

const DEMO_RESPONSES: Record<string, string> = {
  "What is AQI?":
    "The Air Quality Index (AQI) is a standardized composite metric used by environmental protection agencies (such as US-EPA) to translate complex ambient concentrations of multiple pollutants (PM2.5, PM10, NO2, SO2, CO, O3) into a single, intuitive 0 to 500 scale. Numbers below 50 indicate clean air, while values above 150 trigger warnings for the general public.",
  "What causes PM2.5 pollution?":
    "PM2.5 pollution originates from primary and secondary sources:\n1. Direct combustion: Vehicle exhaust (diesel especially), thermal power stations, stubble/biomass burning, and industrial smelting.\n2. Atmospheric synthesis: Gaseous precursors (SO2, NOx, ammonia, VOCs) reacting photochemically in the atmosphere to form secondary aerosol salts.",
  "How can I reduce exposure to polluted air?":
    "Key evidence-based measures to minimize exposure:\n• Monitor hyper-local AQI before outdoor exercise; shift cardio indoors when AQI exceeds 150.\n• Seal room draft gaps and operate high-CADR HEPA purifiers.\n• Avoid morning and late evening rush-hour outdoor exposure when surface thermal inversions trap contaminants.\n• Wear snug-fitting N95 respirators if traveling through heavy traffic corridors.",
  "Explain the difference between PM2.5 and PM10.":
    "PM10 particles (diameter 2.5 to 10 µm) consist of coarse dust and pollen that lodge in the nasal cavity. PM2.5 particles (diameter < 2.5 µm) penetrate deeply into the pulmonary alveoli and enter systemic circulation. Consequently, PM2.5 poses far greater chronic risk to cardiovascular and respiratory health.",
};

export const AssistantPreviewSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: trimmed,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulated assistant response demonstrating the interface
    setTimeout(() => {
      const responseText =
        DEMO_RESPONSES[trimmed] ||
        `AIRWISE AI Demonstration Response: You asked "${trimmed}". In Module 03, this query communicates live with the Google Gemini API, incorporating local sensor telemetry and health preferences.`;

      const aiMsg: ChatMessage = {
        sender: "ai",
        text: responseText,
        timestamp: "Just now",
        insights: {
          severity: "Informational",
          precautions: [
            "Maintain awareness of local particulate trends.",
            "Consult healthcare professionals for tailored respiratory management.",
          ],
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <section id="assistant" className="py-16 space-y-12 scroll-mt-20">
      <SectionHeading
        badgeText="SECTION F • AI ASSISTANT PREVIEW"
        badgeVariant="cyan"
        title="Interactive"
        titleHighlight="AI Assistant Preview"
        description="Experience the conversational guidance model. Ask questions regarding air quality metrics, health precautions, and environmental science."
      />

      {/* Module 02 Demo Disclaimer Notice */}
      <div className="max-w-4xl mx-auto p-3.5 rounded-lg bg-[#141B23] border border-[#28C7F5]/30 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#A5B0BC] font-mono gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#28C7F5] flex-shrink-0" />
          <span>
            <strong className="text-[#F5F7FA]">Interface Demonstration:</strong> This interactive preview simulates client interactions. Full live Google Gemini inference integration is scheduled for Module 03.
          </span>
        </div>
        <Badge variant="cyan" size="sm" className="self-start sm:self-auto font-mono text-[10px]">
          UI Preview Only
        </Badge>
      </div>

      {/* Main Chat Interface Container */}
      <div className="max-w-4xl mx-auto">
        <Card className="border-white/[0.12] bg-[#10151B] p-0 overflow-hidden shadow-2xl">
          {/* Assistant Header */}
          <div className="p-4 bg-[#141B23] border-b border-white/[0.09] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#28C7F5] to-[#38E0B4] flex items-center justify-center shadow-cyan-glow">
                <Bot className="w-5 h-5 text-[#080A0D]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#F5F7FA]">
                    AIRWISE AI Companion
                  </h3>
                  <Badge variant="cyan" size="sm" dot>
                    Active Simulation
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-[#6B7A8D]">
                  Environmental Science & Public Health Advisory Model
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#A5B0BC] hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38E0B4]" />
              <span>WHO / EPA Safe Protocol</span>
            </div>
          </div>

          {/* Suggested Question Chips */}
          <div className="p-3 bg-[#10151B] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-mono text-[#6B7A8D] flex-shrink-0 pl-1">
              Suggestions:
            </span>
            {SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question}
                onClick={() => handleSendMessage(question)}
                className="px-3 py-1 rounded-full text-xs font-medium text-[#A5B0BC] hover:text-[#28C7F5] bg-[#141B23] hover:bg-[#19222D] border border-white/[0.06] hover:border-[#28C7F5]/40 transition-all flex-shrink-0"
              >
                {question}
              </button>
            ))}
          </div>

          {/* Message History Feed */}
          <div className="p-4 sm:p-6 space-y-5 max-h-[460px] overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-lg bg-[#141B23] border border-white/[0.09] flex items-center justify-center text-[#28C7F5] flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#28C7F5]/10 text-[#F5F7FA] border border-[#28C7F5]/30"
                      : "bg-[#141B23] text-[#F5F7FA] border border-white/[0.08]"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Structured Clinical Precautions for AI responses */}
                  {msg.insights && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5 text-xs">
                      <div className="font-mono text-[11px] text-[#38E0B4] font-semibold flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3 text-[#38E0B4]" />
                        Recommended Directives ({msg.insights.severity}):
                      </div>
                      <div className="space-y-1 text-[#A5B0BC]">
                        {msg.insights.precautions.map((p, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#28C7F5] mt-0.5 flex-shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-1 text-[10px] font-mono text-[#6B7A8D] text-right">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-[#28C7F5]/20 border border-[#28C7F5]/30 flex items-center justify-center text-[#28C7F5] flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center text-xs font-mono text-[#28C7F5]">
                <div className="w-8 h-8 rounded-lg bg-[#141B23] border border-white/[0.09] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#28C7F5]" />
                </div>
                <div className="p-3 rounded-lg bg-[#141B23] border border-white/[0.08] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#28C7F5] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#28C7F5] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#28C7F5] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-[#A5B0BC]">Synthesizing environmental guidance...</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Message Input Box */}
          <div className="p-3 sm:p-4 bg-[#141B23] border-t border-white/[0.09]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about air pollution, health impacts, AQI thresholds, or precautions..."
                className="flex-grow px-4 py-2.5 rounded-lg bg-[#10151B] border border-white/[0.09] text-xs sm:text-sm text-[#F5F7FA] placeholder-[#6B7A8D] focus:outline-none focus:border-[#28C7F5]/50 font-sans"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputValue.trim() || isTyping}
                className="px-4"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
            <div className="mt-2 text-[10px] font-mono text-[#6B7A8D] flex justify-between">
              <span>Press Enter or click Send to test response simulation.</span>
              <span>Module 02 UI Demonstration</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
