"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Minimize2, Paperclip, Send, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type AssistantAttachment = {
  name: string;
  url: string;
  type?: string;
  size?: number;
  path?: string;
};

type AssistantMessage = {
  id: string;
  sender_role: "visitor" | "assistant" | "operator";
  sender_label: string;
  content: string;
  created_at: string;
  attachments?: AssistantAttachment[];
};

type Conversation = {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: "ai_active" | "human_takeover" | "resolved";
};

const VISITOR_SESSION_KEY = "sd_assistant_visitor_session";
const CONVERSATION_KEY = "sd_assistant_conversation";
const VISITOR_NAME_KEY = "sd_assistant_visitor_name";
const VISITOR_EMAIL_KEY = "sd_assistant_visitor_email";

const makeVisitorSessionId = () => {
  if (typeof window === "undefined") return "";
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const safeFormatTime = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const playIncomingSound = () => {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(760, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignore audio errors (autoplay policy/devices).
  }
};

export const SiteAssistantWidget = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<AssistantAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorSessionId, setVisitorSessionId] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const latestMessageIdRef = useRef<string | null>(null);

  const shouldHideWidget = pathname === "/" && isAboutVisible;

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const hasVisitorProfile = useMemo(
    () => visitorName.trim().length > 0 && visitorEmail.trim().length > 0,
    [visitorName, visitorEmail]
  );

  const scrollToBottom = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, options?: { silent?: boolean }) => {
      try {
        const response = await fetch(`/api/assistant/messages?conversationId=${encodeURIComponent(conversationId)}&actor=visitor`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        const nextMessages = (data?.messages || []) as AssistantMessage[];

        const previousLastId = latestMessageIdRef.current;
        const nextLastId = nextMessages.length > 0 ? nextMessages[nextMessages.length - 1].id : null;
        latestMessageIdRef.current = nextLastId;

        if (!options?.silent && nextLastId && previousLastId && nextLastId !== previousLastId) {
          const incoming = nextMessages[nextMessages.length - 1];
          if (incoming.sender_role !== "visitor") {
            if (!isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
            playIncomingSound();
          }
        }

        setMessages(nextMessages);
      } catch {
        // Ignore fetch errors and continue polling.
      }
    },
    [isOpen]
  );

  const ensureConversation = useCallback(
    async (profile?: { name?: string; email?: string }) => {
      if (!visitorSessionId) return null;

      try {
        const response = await fetch("/api/assistant/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorSessionId,
            visitorName: profile?.name || visitorName,
            visitorEmail: profile?.email || visitorEmail,
          }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        const nextConversation = data?.conversation as Conversation | undefined;
        if (!nextConversation) return null;

        setConversation(nextConversation);
        localStorage.setItem(CONVERSATION_KEY, nextConversation.id);
        return nextConversation;
      } catch {
        return null;
      }
    },
    [visitorEmail, visitorName, visitorSessionId]
  );

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);

    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  useEffect(() => {
    const storedSession = localStorage.getItem(VISITOR_SESSION_KEY) || makeVisitorSessionId();
    localStorage.setItem(VISITOR_SESSION_KEY, storedSession);
    setVisitorSessionId(storedSession);

    const storedConversationId = localStorage.getItem(CONVERSATION_KEY);
    if (storedConversationId) {
      setConversation((prev) => ({
        id: storedConversationId,
        visitor_name: prev?.visitor_name || null,
        visitor_email: prev?.visitor_email || null,
        status: prev?.status || "ai_active",
      }));
    }

    const storedName = localStorage.getItem(VISITOR_NAME_KEY) || "";
    const storedEmail = localStorage.getItem(VISITOR_EMAIL_KEY) || "";
    setVisitorName(storedName);
    setVisitorEmail(storedEmail);
  }, []);

  useEffect(() => {
    // Only hide widget on home page when About section is visible
    if (pathname !== "/") {
      setIsAboutVisible(false);
      return;
    }

    const section = document.getElementById("about");
    if (!section) {
      setIsAboutVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsAboutVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (shouldHideWidget) {
      setIsOpen(false);
      setUnreadCount(0);
    }
  }, [shouldHideWidget]);

  useEffect(() => {
    if (!conversation?.id) return;
    loadMessages(conversation.id, { silent: true });

    const intervalId = window.setInterval(() => {
      loadMessages(conversation.id);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [conversation?.id, loadMessages]);

  useEffect(() => {
    if (!isOpen) return;
    setUnreadCount(0);
    scrollToBottom();
  }, [isOpen, messages, scrollToBottom]);

  const handleProfileSubmit = async () => {
    const trimmedName = visitorName.trim();
    const trimmedEmail = visitorEmail.trim();
    if (!trimmedName || !trimmedEmail) return;

    localStorage.setItem(VISITOR_NAME_KEY, trimmedName);
    localStorage.setItem(VISITOR_EMAIL_KEY, trimmedEmail);

    setIsEditingProfile(false);
    const nextConversation = await ensureConversation({ name: trimmedName, email: trimmedEmail });
    if (nextConversation?.id) {
      await loadMessages(nextConversation.id, { silent: true });
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversation?.id || (!content.trim() && pendingAttachments.length === 0)) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/assistant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          content,
          senderRole: "visitor",
          language: "en",
          attachments: pendingAttachments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const localNew = [data?.message, data?.assistantMessage].filter(Boolean) as AssistantMessage[];
        if (localNew.length > 0) {
          setMessages((prev) => [...prev, ...localNew]);
        }
        setPendingAttachments([]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const activeConversationId = conversation?.id || (await ensureConversation())?.id;
    if (!activeConversationId) return;

    const formData = new FormData();
    formData.append("conversationId", activeConversationId);
    formData.append("file", file);

    setIsUploadingAttachment(true);
    try {
      const response = await fetch("/api/assistant/attachments", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) return;

      const data = await response.json();
      const attachment = data?.attachment as AssistantAttachment | undefined;
      if (!attachment) return;
      setPendingAttachments((prev) => [...prev, attachment]);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleSend = async () => {
    const payload = inputValue.trim();
    if (!payload && pendingAttachments.length === 0) return;
    setInputValue("");

    if (!conversation?.id) {
      const nextConversation = await ensureConversation();
      if (!nextConversation?.id) return;
    }

    await sendMessage(payload);
  };

  const handleOpen = async () => {
    if (shouldHideWidget) return;
    setIsOpen((prev) => !prev);

    if (!conversation?.id && hasVisitorProfile) {
      const nextConversation = await ensureConversation();
      if (nextConversation?.id) {
        await loadMessages(nextConversation.id, { silent: true });
      }
    }
  };

  if (shouldHideWidget) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[95] md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-3 w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-3xl border border-foreground/10 bg-background/95 shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">SheetalDharshan Assistant</p>
                  <p className="text-[11px] text-foreground/55">
                    <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-amber-500")} />
                    {isOnline ? "Online now" : "Trying to reconnect"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {hasVisitorProfile && !isEditingProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="rounded-full p-2 text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                    title="Edit profile"
                    aria-label="Edit profile"
                  >
                    <UserRound className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                  aria-label="Minimize assistant"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!hasVisitorProfile || isEditingProfile ? (
              <div className="space-y-3 p-4">
                <p className="text-xs text-foreground/70">
                  {isEditingProfile ? "Update your details" : "Before we start, share your details so Sheetal can follow up with you."}
                </p>
                <input
                  value={visitorName}
                  onChange={(event) => setVisitorName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleProfileSubmit();
                    }
                  }}
                  placeholder="Your name"
                  className="h-10 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40"
                  autoComplete="name"
                />
                <input
                  value={visitorEmail}
                  onChange={(event) => setVisitorEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleProfileSubmit();
                    }
                  }}
                  placeholder="Your email"
                  type="email"
                  autoComplete="email"
                  className="h-10 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleProfileSubmit}
                  disabled={!visitorName.trim() || !visitorEmail.trim()}
                  className="h-10 w-full rounded-xl bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditingProfile ? "Update profile" : "Start chat"}
                </button>
                {isEditingProfile && (
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setVisitorName(localStorage.getItem(VISITOR_NAME_KEY) || "");
                      setVisitorEmail(localStorage.getItem(VISITOR_EMAIL_KEY) || "");
                    }}
                    className="h-10 w-full rounded-xl border border-foreground/15 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <>
                <div ref={listRef} className="max-h-[380px] min-h-[280px] space-y-2 overflow-y-auto px-3 py-3">
                  {messages.length === 0 && (
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-xs text-foreground/70">
                      Hi {visitorName || "there"}, ask anything about Sheetal. AI replies instantly, and Sheetal can jump in anytime.
                    </div>
                  )}
                  {messages.map((message) => {
                    const isVisitor = message.sender_role === "visitor";
                    return (
                      <div key={message.id} className={cn("flex w-full", isVisitor ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                            isVisitor
                              ? "rounded-br-md bg-foreground text-background"
                              : "rounded-bl-md border border-foreground/10 bg-foreground/[0.03] text-foreground"
                          )}
                        >
                          {!isVisitor && <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-foreground/45">{message.sender_label}</p>}
                          <p className="whitespace-pre-wrap leading-5">{message.content}</p>
                          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={`${message.id}-${attachment.url}`}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    "block rounded-xl border px-2.5 py-1.5 text-xs",
                                    isVisitor
                                      ? "border-background/25 bg-background/10 text-background"
                                      : "border-foreground/15 bg-background/40 text-foreground"
                                  )}
                                >
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          )}
                          <p className={cn("mt-1 text-[10px]", isVisitor ? "text-background/65" : "text-foreground/45")}>
                            {safeFormatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-xs text-foreground/55">
                        SheetalDharshan Assistant is typing...
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-foreground/10 px-3 py-2">
                  {pendingAttachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {pendingAttachments.map((attachment) => (
                        <span
                          key={attachment.url}
                          className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/[0.03] px-2 py-1 text-[11px] text-foreground/70"
                        >
                          {attachment.name}
                          <button
                            onClick={() => setPendingAttachments((prev) => prev.filter((item) => item.url !== attachment.url))}
                            className="text-foreground/45 hover:text-foreground"
                            aria-label="Remove attachment"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-2xl border border-foreground/15 bg-background px-2">
                    <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground">
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                      <Paperclip className="h-4 w-4" />
                    </label>
                    <input
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type your message..."
                      className="h-10 w-full bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-foreground/35"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isSending || isUploadingAttachment || (inputValue.trim().length === 0 && pendingAttachments.length === 0)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-all disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleOpen}
        className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-foreground text-background shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.03]"
        aria-label="Open assistant"
      >
        <MessageCircle className="h-6 w-6" />
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="pointer-events-none absolute -left-44 top-1/2 hidden -translate-y-1/2 rounded-full border border-foreground/10 bg-background/90 px-3 py-1 text-xs text-foreground/75 shadow-lg backdrop-blur-sm md:block md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <UserRound className="mr-1 inline h-3 w-3" />
          Chat with Sheetal
        </span>
      </button>
    </div>
  );
};
