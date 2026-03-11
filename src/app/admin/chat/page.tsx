"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Bell, BellOff, ChevronDown, ChevronUp, Paperclip, Search, Send, X } from "lucide-react";

type AssistantAttachment = {
  name: string;
  url: string;
  type?: string;
  size?: number;
};

type Conversation = {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: "ai_active" | "human_takeover" | "resolved";
  unread_for_operator: number;
  updated_at: string;
};

type AssistantMessage = {
  id: string;
  sender_role: "visitor" | "assistant" | "operator";
  sender_label: string;
  content: string;
  created_at: string;
  attachments?: AssistantAttachment[];
};

const OPERATOR_KEY_STORAGE = "sd_assistant_operator_key";

const base64UrlToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const formatRelativeTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const statusLabel = (status: Conversation["status"]) => {
  if (status === "ai_active") return "AI Active";
  if (status === "human_takeover") return "Human Takeover";
  return "Resolved";
};

const statusPillClass = (status: Conversation["status"], active: boolean) => {
  if (status === "ai_active") {
    return active
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "human_takeover") {
    return active
      ? "border-amber-500/45 bg-amber-500/15 text-amber-300"
      : "border-amber-500/35 bg-amber-500/10 text-amber-300";
  }

  return active
    ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
    : "border-sky-500/30 bg-sky-500/10 text-sky-300";
};

const quickReplySuggestions = [
  "Thanks for the details. I can help with that.",
  "Could you share your timeline and budget?",
  "I can guide you to the right section now.",
  "Want me to schedule a quick call?",
];

export default function AdminChatPage() {
  const [operatorKey, setOperatorKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<AssistantAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const [conversationQuery, setConversationQuery] = useState("");
  const [activeScrollPanel, setActiveScrollPanel] = useState<"conversations" | "messages" | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const previousConversationIdRef = useRef<string | null>(null);
  const previousLastMessageIdRef = useRef<string | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.unread_for_operator || 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((item) => {
      const name = (item.visitor_name || "anonymous visitor").toLowerCase();
      const email = (item.visitor_email || "").toLowerCase();
      const status = statusLabel(item.status).toLowerCase();
      return name.includes(query) || email.includes(query) || status.includes(query);
    });
  }, [conversationQuery, conversations]);

  const fetchConversations = useCallback(async () => {
    if (!operatorKey) return;
    setLoadingConversations(true);

    try {
      const response = await fetch("/api/assistant/conversations?mode=admin", {
        headers: {
          "x-operator-key": operatorKey,
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      const next = (data?.conversations || []) as Conversation[];
      setConversations(next);
      if (!activeConversationId && next.length > 0) {
        setActiveConversationId(next[0].id);
      }
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConversationId, operatorKey]);

  const fetchMessages = useCallback(async () => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/assistant/messages?conversationId=${encodeURIComponent(activeConversationId)}&actor=operator`, {
        headers: operatorKey
          ? {
              "x-operator-key": operatorKey,
            }
          : undefined,
      });
      if (!response.ok) return;
      const data = await response.json();
      setMessages((data?.messages || []) as AssistantMessage[]);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeConversationId, operatorKey]);

  useEffect(() => {
    const stored = localStorage.getItem(OPERATOR_KEY_STORAGE) || "";
    if (stored) {
      setOperatorKey(stored);
      setDraftKey(stored);
    }

    const detectSubscription = async () => {
      if (!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.getRegistration("/assistant-sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      setIsPushEnabled(Boolean(subscription));
    };

    detectSubscription();
  }, []);

  useEffect(() => {
    if (!operatorKey) return;
    
    fetchConversations();
    const id = window.setInterval(() => {
      fetchConversations();
    }, 2500);

    return () => window.clearInterval(id);
  }, [fetchConversations, operatorKey]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    fetchMessages();
    const id = window.setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => window.clearInterval(id);
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;

    const latestMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
    const didConversationChange = previousConversationIdRef.current !== activeConversationId;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 140;

    if (didConversationChange) {
      container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    } else if (latestMessageId && latestMessageId !== previousLastMessageIdRef.current && isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }

    previousConversationIdRef.current = activeConversationId;
    previousLastMessageIdRef.current = latestMessageId;
  }, [activeConversationId, messages]);

  const handleSaveOperatorKey = () => {
    const trimmed = draftKey.trim();
    setOperatorKey(trimmed);
    localStorage.setItem(OPERATOR_KEY_STORAGE, trimmed);
  };

  const handleSendOperatorMessage = async () => {
    if (!activeConversationId || (!inputValue.trim() && pendingAttachments.length === 0) || !operatorKey) return;

    const payload = inputValue.trim();
    setInputValue("");

    await fetch("/api/assistant/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-operator-key": operatorKey,
      },
      body: JSON.stringify({
        conversationId: activeConversationId,
        content: payload,
        senderRole: "operator",
        attachments: pendingAttachments,
      }),
    });

    setPendingAttachments([]);
    fetchMessages();
    fetchConversations();
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeConversationId) return;

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

  const handleEnablePush = async () => {
    if (!operatorKey || !("serviceWorker" in navigator)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/assistant-sw.js");
    const vapidResponse = await fetch("/api/assistant/notifications/public-key");
    if (!vapidResponse.ok) return;
    const vapidData = await vapidResponse.json();
    const publicKey = String(vapidData?.publicKey || "");
    if (!publicKey) return;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publicKey),
      }));

    await fetch("/api/assistant/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-operator-key": operatorKey,
      },
      body: JSON.stringify({
        ...subscription.toJSON(),
        role: "operator",
      }),
    });

    setIsPushEnabled(true);
  };

  const handleDisablePush = async () => {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration("/assistant-sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      setIsPushEnabled(false);
      return;
    }

    await fetch("/api/assistant/notifications/subscribe", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
    setIsPushEnabled(false);
  };

  const handleStatusChange = async (status: Conversation["status"]) => {
    if (!activeConversationId || !operatorKey) return;

    await fetch("/api/assistant/conversations", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-operator-key": operatorKey,
      },
      body: JSON.stringify({
        conversationId: activeConversationId,
        status,
      }),
    });

    fetchConversations();
  };

  const handleQuickReply = (text: string) => {
    setInputValue((prev) => (prev.trim().length > 0 ? `${prev} ${text}` : text));
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex-1 px-2 pb-2 pt-3 md:px-4 md:pb-3 md:pt-4">
        <div className="mx-auto flex h-[calc(100svh-1.25rem)] w-full max-w-[min(99vw,1760px)] flex-col">
          <div className="mb-1.5 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold text-foreground">Assistant Operator Inbox</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingsCollapsed((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background/70 px-3 py-1 text-[11px] text-foreground/75 transition-colors hover:border-foreground/25"
                >
                  {isSettingsCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  Settings
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/70 px-3 py-1 text-[11px] text-foreground/70">
                <span>Conversations: {conversations.length}</span>
                <span className="h-1 w-1 rounded-full bg-foreground/30" />
                <span>Unread: {unreadTotal}</span>
                </div>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-foreground/55">
              Human replies appear to visitors as Sheetal Dharshan. AI mode can be paused with Human Takeover.
            </p>
            {!isSettingsCollapsed && (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={draftKey}
                  onChange={(event) => setDraftKey(event.target.value)}
                  placeholder="ASSISTANT_OPERATOR_KEY"
                  className="h-10 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleSaveOperatorKey}
                  className="h-10 rounded-xl bg-foreground px-4 text-sm font-medium text-background sm:min-w-[88px]"
                >
                  Save
                </button>
                <button
                  onClick={isPushEnabled ? handleDisablePush : handleEnablePush}
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-foreground/20 px-3 text-xs text-foreground/80 sm:min-w-[110px]"
                >
                  {isPushEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {isPushEnabled ? "Push On" : "Enable Push"}
                </button>
              </div>
            )}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-2">
            <div className="mb-2 px-2 py-1 text-xs uppercase tracking-[0.14em] text-foreground/50">
              Conversations ({filteredConversations.length})
            </div>
            <div className="mb-2 px-1">
              <div className="flex items-center gap-2 rounded-xl border border-foreground/15 bg-background px-2">
                <Search className="h-3.5 w-3.5 text-foreground/45" />
                <input
                  value={conversationQuery}
                  onChange={(event) => setConversationQuery(event.target.value)}
                  placeholder="Search conversations"
                  className="h-8 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground/40"
                />
              </div>
            </div>
            <div
              onMouseDown={() => setActiveScrollPanel("conversations")}
              onFocus={() => setActiveScrollPanel("conversations")}
              className={cn(
                "admin-chat-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1",
                activeScrollPanel !== "conversations" && "admin-chat-scroll-idle"
              )}
            >
              {filteredConversations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveConversationId(item.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                    item.id === activeConversationId
                      ? "border-primary/35 bg-primary/10"
                      : "border-foreground/10 bg-background hover:bg-foreground/[0.03]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">
                    {item.visitor_name || "Anonymous visitor"}
                    </p>
                    <span className="text-[10px] text-foreground/45">{formatRelativeTime(item.updated_at)}</span>
                  </div>
                  <p className="text-[11px] text-foreground/50">{item.visitor_email || "No email"}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px]", statusPillClass(item.status, item.id === activeConversationId))}>
                      {statusLabel(item.status)}
                    </span>
                    {item.unread_for_operator > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                        {item.unread_for_operator}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {!loadingConversations && filteredConversations.length === 0 && (
                <p className="px-2 py-4 text-xs text-foreground/45">No conversations yet.</p>
              )}
            </div>
          </aside>

          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
            {activeConversation ? (
              <>
                <div className="border-b border-foreground/10 px-4 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{activeConversation.visitor_name || "Anonymous visitor"}</p>
                      <p className="text-xs text-foreground/55">{activeConversation.visitor_email || "No email"}</p>
                    </div>
                    <span className="text-[11px] text-foreground/45">Updated {formatRelativeTime(activeConversation.updated_at)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleStatusChange("ai_active")}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        activeConversation.status === "ai_active"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : "border-foreground/15 text-foreground/70"
                      )}
                    >
                      AI Active
                    </button>
                    <button
                      onClick={() => handleStatusChange("human_takeover")}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        activeConversation.status === "human_takeover"
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                          : "border-foreground/15 text-foreground/70"
                      )}
                    >
                      Human Takeover
                    </button>
                    <button
                      onClick={() => handleStatusChange("resolved")}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        activeConversation.status === "resolved"
                          ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                          : "border-foreground/15 text-foreground/70"
                      )}
                    >
                      Resolved
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center px-4 py-3">
                <p className="text-sm text-foreground/55">Select a conversation to start</p>
              </div>
            )}

            {activeConversation && (
              <>
                <div
                  ref={messagesScrollRef}
                  onMouseDown={() => setActiveScrollPanel("messages")}
                  onFocus={() => setActiveScrollPanel("messages")}
                  className={cn(
                    "admin-chat-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3",
                    activeScrollPanel !== "messages" && "admin-chat-scroll-idle"
                  )}
                >
                  {!loadingMessages && messages.length === 0 && <p className="text-xs text-foreground/45">No messages in this thread.</p>}
                  {messages.map((message) => {
                const isVisitor = message.sender_role === "visitor";
                const isOperator = message.sender_role === "operator";
                const isAssistant = message.sender_role === "assistant";
                return (
                  <div key={message.id} className={cn("flex", isOperator ? "justify-end" : "justify-start")}>
                    {isOperator ? (
                      <div className="max-w-[78%] rounded-2xl rounded-br-md bg-gradient-to-r from-fuchsia-500/85 via-violet-500/85 to-cyan-500/85 p-[1px] shadow-[0_10px_28px_rgba(139,92,246,0.25)]">
                        <div className="rounded-2xl rounded-br-md bg-background px-3 py-2 text-foreground">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-foreground/50">{message.sender_label}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
                          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={`${message.id}-${attachment.url}`}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-xl border border-foreground/20 bg-foreground/[0.03] px-2.5 py-1.5 text-xs text-foreground"
                                >
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          )}
                          <p className="mt-1 text-[10px] text-foreground/45">{formatTime(message.created_at)}</p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "max-w-[78%] rounded-2xl px-3 py-2",
                          isVisitor
                            ? "rounded-bl-md border border-foreground/10 bg-background"
                            : "rounded-bl-md border border-sky-500/25 bg-sky-500/[0.08] text-foreground"
                        )}
                      >
                        <p className={cn("text-[10px] uppercase tracking-[0.12em]", isVisitor ? "text-foreground/45" : "text-sky-300/80")}>
                          {message.sender_label}
                        </p>
                        <p className={cn("mt-1 whitespace-pre-wrap text-sm", isAssistant ? "text-foreground" : "text-foreground")}>{message.content}</p>
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
                                    ? "border-foreground/20 bg-foreground/[0.03] text-foreground"
                                    : "border-sky-500/20 bg-sky-500/[0.06] text-foreground"
                                )}
                              >
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className={cn("mt-1 text-[10px]", isVisitor ? "text-foreground/45" : "text-foreground/50")}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                  );
                })}
                </div>
              </>
            )}

            {activeConversation && (
              <div className="border-t border-foreground/10 bg-background/45 p-2.5 backdrop-blur-sm">
              <p className="mb-1 text-[10px] text-foreground/45">
                Use hidden navigation tags like [[open:/blog]], [[open:/hire-me]], or [[scroll:projects]] to move the visitor without showing the tag in chat.
              </p>
              <div className="admin-chat-scroll-x mb-1.5 flex gap-1.5 overflow-x-auto pb-1">
                {quickReplySuggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleQuickReply(item)}
                    className="whitespace-nowrap rounded-full border border-foreground/15 bg-foreground/[0.03] px-2 py-0.5 text-[10px] text-foreground/75 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>
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
                  <input type="file" className="hidden" onChange={handleAttachmentUpload} disabled={!activeConversationId} />
                  <Paperclip className="h-4 w-4" />
                </label>
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSendOperatorMessage();
                    }
                  }}
                  placeholder="Reply as Sheetal Dharshan..."
                  className="h-9 w-full bg-transparent px-2 text-sm text-foreground outline-none"
                />
                <button
                  onClick={handleSendOperatorMessage}
                  disabled={!activeConversationId || isUploadingAttachment || (inputValue.trim().length === 0 && pendingAttachments.length === 0)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            )}
          </section>
          </div>
        </div>
      </div>
    </main>
  );
}
