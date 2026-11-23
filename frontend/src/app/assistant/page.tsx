"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Activity,
  Menu,
  X,
  Wind,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppLayout } from "@/components/layout/AppLayout";
import { ApiClient } from "@/services/api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ConversationItem, MessageItem, AIProviderStatusResponse } from "@/types";

const SUGGESTED_QUESTIONS = [
  "What is AQI and how is it calculated in India?",
  "Why is PM2.5 high during winter in Ahmedabad and New Delhi?",
  "What health precautions should asthma patients take when AQI > 150?",
  "How do HEPA air purifiers and indoor ventilation reduce smog exposure?",
  "What is the difference between PM2.5 and PM10 particles?",
];

function FormattedAssistantMessage({ content }: { content: string }) {
  // Check if it is the off-topic rejection notice
  if (content.includes("outside the scope of AIRWISE AI")) {
    return (
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Out of Domain Inquiry</span>
        </div>
        <p className="text-xs leading-relaxed text-foreground">
          {content}
        </p>
        <div className="text-[11px] text-foreground-muted pt-1 border-t border-amber-500/15">
          Tip: Ask about local air quality (AQI), PM2.5 / PM10 levels, health precautions, or smog weather.
        </div>
      </div>
    );
  }

  // Parse lines into structured visual sections
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "bullet" | "number"; items: { prefix?: string; text: string }[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!currentList || currentList.items.length === 0) return;
    if (currentList.type === "bullet") {
      elements.push(
        <div key={`${keyPrefix}-bullet-group`} className="space-y-1.5 my-2">
          {currentList.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                {renderInlineMarkdown(item.text)}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      elements.push(
        <div key={`${keyPrefix}-num-group`} className="space-y-1.5 my-2">
          {currentList.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.prefix || idx + 1}
              </span>
              <div className="flex-1">
                {renderInlineMarkdown(item.text)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    currentList = null;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(`flush-${idx}`);
      return;
    }

    // 1. Headers (### or ## or #)
    if (line.startsWith("#")) {
      flushList(`hdr-${idx}`);
      const headerText = line.replace(/^#+\s*/, "");
      elements.push(
        <div key={`h-${idx}`} className="flex items-center gap-2 pt-3 pb-1 border-b border-border-subtle first:pt-0 mb-2">
          <div className="w-1.5 h-4 rounded-full bg-primary flex-shrink-0" />
          <h4 className="font-bold text-xs sm:text-sm tracking-tight text-foreground">
            {headerText}
          </h4>
        </div>
      );
      return;
    }

    // 2. Callout cards (e.g. **Simple Summary:** or **Key Takeaway:** or **Core Guidance:**)
    const calloutMatch = line.match(/^\*\*(Simple Summary|Key Takeaway|Core Guidance|Key Insights|Actionable Guidance|Health Warning|Emergency Notice):\*\*\s*(.*)/i);
    if (calloutMatch) {
      flushList(`callout-${idx}`);
      const [, title, rest] = calloutMatch;
      elements.push(
        <div key={`callout-${idx}`} className="p-3 my-2 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{title}</span>
          </div>
          {rest && (
            <p className="text-xs leading-relaxed text-foreground">
              {renderInlineMarkdown(rest)}
            </p>
          )}
        </div>
      );
      return;
    }

    // 3. Bullet points (- or * )
    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "bullet") {
        flushList(`switch-b-${idx}`);
        currentList = { type: "bullet", items: [] };
      }
      currentList.items.push({ text: bulletMatch[1] });
      return;
    }

    // 4. Numbered list (1. 2. )
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!currentList || currentList.type !== "number") {
        flushList(`switch-n-${idx}`);
        currentList = { type: "number", items: [] };
      }
      currentList.items.push({ prefix: numMatch[1], text: numMatch[2] });
      return;
    }

    // 5. Standalone section label like **Detailed Comparison:** or **CPCB vs WHO Standards:**
    const sectionLabelMatch = line.match(/^\*\*([^*]+):\*\*\s*$/);
    if (sectionLabelMatch) {
      flushList(`sec-${idx}`);
      elements.push(
        <div key={`sec-${idx}`} className="font-semibold text-xs text-foreground tracking-tight pt-2 pb-0.5 text-primary flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>{sectionLabelMatch[1]}</span>
        </div>
      );
      return;
    }

    // 6. Regular paragraph
    flushList(`p-${idx}`);
    elements.push(
      <p key={`p-${idx}`} className="text-xs leading-relaxed text-foreground my-1">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList("final");

  return <div className="space-y-1">{elements}</div>;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-foreground-secondary">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-background-secondary border border-border-subtle font-mono text-[11px] text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function AssistantPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <AssistantWorkspace />
      </AppLayout>
    </AuthGuard>
  );
}

function AssistantWorkspace() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [aiStatus, setAiStatus] = useState<AIProviderStatusResponse | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    ApiClient.getAIStatus()
      .then((res) => {
        if (res.success && res.data) {
          setAiStatus(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsConversationsLoading(true);
    try {
      const res = await ApiClient.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConversationId) {
          setActiveConversationId(res.data[0].id);
          loadMessages(res.data[0].id);
        }
      }
    } catch {
      setErrorMessage("Failed to load past conversation sessions.");
    } finally {
      setIsConversationsLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const res = await ApiClient.getMessages(conversationId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch {
      setErrorMessage("Failed to load message history for this conversation.");
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await ApiClient.createConversation({ title: "New Environmental Conversation" });
      if (res.success && res.data) {
        const newConv = res.data;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
        setIsMobileSidebarOpen(false);
        inputRef.current?.focus();
      }
    } catch {
      setErrorMessage("Failed to create a new conversation session.");
    }
  };

  const handleSelectConversation = (conv: ConversationItem) => {
    setActiveConversationId(conv.id);
    loadMessages(conv.id);
    setIsMobileSidebarOpen(false);
    setErrorMessage(null);
  };

  const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApiClient.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
          loadMessages(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
      setDeleteConfirmId(null);
    } catch {
      setErrorMessage("Failed to delete the conversation session.");
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim();
    if (!text || isLoading) return;

    let convId = activeConversationId;

    if (!convId) {
      try {
        const titleSnippet = text.length > 35 ? `${text.slice(0, 35)}...` : text;
        const createRes = await ApiClient.createConversation({ title: titleSnippet });
        if (createRes.success && createRes.data) {
          convId = createRes.data.id;
          setActiveConversationId(convId);
          setConversations((prev) => [createRes.data, ...prev]);
        } else {
          setErrorMessage("Could not establish a conversation session.");
          return;
        }
      } catch {
        setErrorMessage("Could not establish a conversation session.");
        return;
      }
    }

    setInputValue("");
    setErrorMessage(null);
    setIsLoading(true);

    const tempUserMessage: MessageItem = {
      id: Date.now(),
      conversation_id: convId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const res = await ApiClient.sendChatMessage(convId, text);
      if (res.success && res.data) {
        const { user_message, assistant_message } = res.data;
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
          return [...filtered, user_message, assistant_message];
        });

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === convId && c.title === "New Environmental Conversation") {
              const snippet = text.length > 35 ? `${text.slice(0, 35)}...` : text;
              return { ...c, title: snippet, updated_at: new Date().toISOString() };
            }
            return c;
          })
        );
      } else {
        throw new Error(res.message || "Failed to receive AI response.");
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : "An error occurred with the AI service.";
      setErrorMessage(errorText);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              AI Environmental Assistant
            </h1>
            <p className="text-xs text-foreground-secondary">
              Natural language pollution intelligence powered by Google Gemini and grounded in WHO standards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Gemini 3.5 Flash</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={createNewConversation}
            className="text-xs"
            disabled={isLoading}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[620px]">
        {/* Left Sessions Drawer (Span 4) */}
        <div className="hidden md:block md:col-span-4">
          <Card className="p-4 h-full flex flex-col justify-between space-y-3">
            <div className="space-y-2 flex-1 overflow-y-auto">
              <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted block px-1">
                Your Conversation Sessions
              </span>

              {isConversationsLoading ? (
                <div className="flex items-center justify-center p-6 text-xs text-foreground-muted gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Loading sessions...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-foreground-muted">
                  No previous sessions. Click &ldquo;New Chat&rdquo; to start.
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    const isConfirming = deleteConfirmId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`group flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                          isActive
                            ? "bg-primary text-white dark:text-black font-semibold shadow-sm"
                            : "hover:bg-surface-hover text-foreground-secondary hover:text-foreground border border-border-subtle"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{conv.title}</span>
                        </div>

                        {isConfirming ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                              className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px]"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 rounded bg-surface text-foreground text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Encrypted server-side session memory</span>
            </div>
          </Card>
        </div>

        {/* Right Active Chat Area (Span 8) */}
        <div className="col-span-12 md:col-span-8 flex flex-col">
          <Card className="p-0 h-full flex flex-col justify-between overflow-hidden">
            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="max-w-md mx-auto py-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Ask Any Pollution & Health Question
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
                      Understand air quality ratings, particulate risks, safe workout windows, or purifier settings.
                    </p>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-full bg-background-secondary border border-border-subtle hover:border-primary text-xs text-foreground-secondary hover:text-foreground text-left transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                          isUser
                            ? "bg-primary text-white dark:text-black font-medium whitespace-pre-wrap"
                            : "bg-surface border border-border-subtle text-foreground"
                        }`}
                      >
                        {isUser ? (
                          <div>{msg.content}</div>
                        ) : (
                          <FormattedAssistantMessage content={msg.content} />
                        )}

                        {!isUser && (
                          <div className="pt-2.5 flex items-center justify-between text-[10px] text-foreground-muted border-t border-border-subtle/50">
                            <span className="flex items-center gap-1.5 text-primary/80 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                              Grounded in WHO &amp; CPCB Guidelines
                            </span>
                            <button
                              onClick={() => handleCopyText(msg.content, msg.id)}
                              className="hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-primary" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white dark:text-black font-bold text-xs flex-shrink-0 mt-0.5">
                          U
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex gap-3 items-center text-xs text-foreground-muted">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Gemini is generating response...</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-300 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-border-subtle bg-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about local air quality or health guidelines... (Enter to send)"
                  rows={1}
                  className="flex-1 resize-none px-3.5 py-2.5 text-xs rounded-xl bg-background-secondary border border-border-subtle focus:border-primary focus:outline-none text-foreground placeholder:text-foreground-muted"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
