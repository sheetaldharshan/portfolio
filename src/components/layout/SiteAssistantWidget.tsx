"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Minimize2, Paperclip, Send, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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

type AssistantIntentTarget = {
  kind: "section" | "route";
  value: string;
  reply: string;
  notice: string;
};

const VISITOR_SESSION_KEY = "sd_assistant_visitor_session";
const CONVERSATION_KEY = "sd_assistant_conversation";
const VISITOR_NAME_KEY = "sd_assistant_visitor_name";
const VISITOR_EMAIL_KEY = "sd_assistant_visitor_email";
const VISITOR_PROFILE_CONFIRMED_KEY = "sd_assistant_profile_confirmed";
const WIDGET_SIZE_KEY = "sd_assistant_widget_size_v1";
const NAVIGATION_COMMAND_PATTERN = /\[\[(open|scroll):([^\]]+)\]\]/gi;
const DEFAULT_WIDGET_WIDTH = 338;
const DEFAULT_WIDGET_HEIGHT = 560;
const MIN_WIDGET_WIDTH = 300;
const MIN_WIDGET_HEIGHT = 380;
const VIEWPORT_MARGIN_X = 24;
const VIEWPORT_MARGIN_Y = 88;

const isValidEmail = (value: string) => /^(?:[a-zA-Z0-9_'^&+%\-/=?`{|}~.!#$*])+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value);

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

const byCreatedAtAsc = (a: AssistantMessage, b: AssistantMessage) => {
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();

  const safeATime = Number.isNaN(aTime) ? 0 : aTime;
  const safeBTime = Number.isNaN(bTime) ? 0 : bTime;

  if (safeATime !== safeBTime) {
    return safeATime - safeBTime;
  }

  return String(a.id).localeCompare(String(b.id));
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

const intentTargets: Array<{ pattern: RegExp; target: AssistantIntentTarget }> = [
  {
    pattern: /\b(project|projects|portfolio|case study|case studies|build|built|show me your work)\b/i,
    target: {
      kind: "section",
      value: "projects",
      reply: "She has worked on multiple portfolio and client-focused builds that highlight real-world problem solving and product thinking.",
      notice: "Opening projects...",
    },
  },
  {
    pattern: /\b(blog|blogs|post|posts|article|articles|writing|writings|interest|interests|read|reading)\b/i,
    target: {
      kind: "route",
      value: "/blog",
      reply: "She also shares ideas and written insights around development, digital work, and practical learnings.",
      notice: "Opening blog...",
    },
  },
  {
    pattern: /\b(hire|contact|service|services|freelance|freelancer|collaborate|collaboration|quote|client work|get in touch)\b/i,
    target: {
      kind: "route",
      value: "/hire-me",
      reply: "If you are planning a project, she is available for collaboration and service-based engagements.",
      notice: "Opening hire me...",
    },
  },
  {
    pattern: /\b(book|schedule|meeting|consultation|consult|call|appointment|discuss)\b/i,
    target: {
      kind: "route",
      value: "/book-a-call",
      reply: "You can directly schedule a discussion to talk through requirements, ideas, or timelines.",
      notice: "Opening booking...",
    },
  },
  {
    pattern: /\b(about|background|story|journey|who are you|get to know|bio|myself|resume)\b/i,
    target: {
      kind: "route",
      value: "/about",
      reply: "Sheetal Dharshan is focused on building modern web experiences with a mix of technical depth, design clarity, and practical execution.",
      notice: "Opening about...",
    },
  },
  {
    pattern: /\b(skill|skills|stack|tech stack|technology|technologies|tools|framework|frameworks)\b/i,
    target: {
      kind: "section",
      value: "skills",
      reply: "Her stack includes frontend, backend, and tooling skills used to ship complete products end-to-end.",
      notice: "Opening skills...",
    },
  },
  {
    pattern: /\b(what do you do|what you do|services overview|offer|offers|what can you do)\b/i,
    target: {
      kind: "section",
      value: "whatido",
      reply: "She works across development, solution design, and execution support depending on project needs.",
      notice: "Opening what I do...",
    },
  },
  {
    pattern: /\b(work|experience|career|employment|professional experience|resume work)\b/i,
    target: {
      kind: "route",
      value: "/work",
      reply: "Her work history reflects hands-on delivery across different types of digital and web initiatives.",
      notice: "Opening work...",
    },
  },
];

const resolveIntentTarget = (value: string) => {
  for (const intent of intentTargets) {
    if (intent.pattern.test(value)) {
      return intent.target;
    }
  }

  return null;
};

const sanitizeMessageContent = (value: string) => value.replace(NAVIGATION_COMMAND_PATTERN, "").replace(/\s{2,}/g, " ").trim();

const resolveCommandTarget = (value: string): AssistantIntentTarget | null => {
  const regex = new RegExp(NAVIGATION_COMMAND_PATTERN.source, "gi");
  let latestMatch: RegExpExecArray | null = null;
  let currentMatch = regex.exec(value);

  while (currentMatch) {
    latestMatch = currentMatch;
    currentMatch = regex.exec(value);
  }

  if (!latestMatch) return null;

  const [, action, rawTarget] = latestMatch;
  const normalizedTarget = rawTarget.trim();
  if (!normalizedTarget) return null;

  if (action === "scroll") {
    return {
      kind: "section",
      value: normalizedTarget.replace(/^#/, ""),
      reply: "",
      notice: `Opening ${normalizedTarget.replace(/^#/, "")}...`,
    };
  }

  if (normalizedTarget.startsWith("#")) {
    return {
      kind: "section",
      value: normalizedTarget.slice(1),
      reply: "",
      notice: `Opening ${normalizedTarget.slice(1)}...`,
    };
  }

  return {
    kind: "route",
    value: normalizedTarget.startsWith("/") ? normalizedTarget : `/${normalizedTarget}`,
    reply: "",
    notice: `Opening ${normalizedTarget.replace(/^\//, "")}...`,
  };
};

const classifyConfirmationFallback = (message: string) => {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return "unclear" as const;

  if (/(^|\b)(yes|yeah|yep|sure|okay|ok|go ahead|please do|do it|take me there|open it|move me|sounds good|why not)(\b|$)/i.test(normalized)) {
    return "confirm" as const;
  }

  if (/(^|\b)(no|nope|nah|not now|stay here|don't|do not|leave it)(\b|$)/i.test(normalized)) {
    return "reject" as const;
  }

  return "unclear" as const;
};

export const SiteAssistantWidget = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
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
  const [isProfileConfirmed, setIsProfileConfirmed] = useState(false);
  const [navigationNotice, setNavigationNotice] = useState<string | null>(null);
  const [pendingNavigationTarget, setPendingNavigationTarget] = useState<AssistantIntentTarget | null>(null);
  const [widgetSize, setWidgetSize] = useState({ width: DEFAULT_WIDGET_WIDTH, height: DEFAULT_WIDGET_HEIGHT });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCursor, setResizeCursor] = useState<"nesw-resize" | "nwse-resize">("nesw-resize");
  const widgetRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const latestOperatorNavigationIdRef = useRef<string | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const resizePointerIdRef = useRef<number | null>(null);
  const resizeDirectionRef = useRef<{ x: 1 | -1; y: 1 | -1 }>({ x: -1, y: -1 });

  const getMaxWidgetSize = useCallback(() => {
    if (typeof window === "undefined") {
      return { width: DEFAULT_WIDGET_WIDTH, height: DEFAULT_WIDGET_HEIGHT };
    }

    return {
      width: Math.max(MIN_WIDGET_WIDTH, window.innerWidth - VIEWPORT_MARGIN_X),
      height: Math.max(MIN_WIDGET_HEIGHT, window.innerHeight - VIEWPORT_MARGIN_Y),
    };
  }, []);

  const clampWidgetSize = useCallback(
    (nextWidth: number, nextHeight: number) => {
      const maxSize = getMaxWidgetSize();
      return {
        width: Math.min(maxSize.width, Math.max(MIN_WIDGET_WIDTH, nextWidth)),
        height: Math.min(maxSize.height, Math.max(MIN_WIDGET_HEIGHT, nextHeight)),
      };
    },
    [getMaxWidgetSize]
  );

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const hasVisitorProfile = useMemo(
    () => visitorName.trim().length > 0 && visitorEmail.trim().length > 0,
    [visitorName, visitorEmail]
  );

  const canSubmitProfile = useMemo(
    () => visitorName.trim().length > 1 && isValidEmail(visitorEmail.trim()),
    [visitorEmail, visitorName]
  );

  const scrollToBottom = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, []);

  const handleMessageListWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const container = listRef.current;
    if (!container) return;

    const canScroll = container.scrollHeight > container.clientHeight;
    event.preventDefault();
    event.stopPropagation();

    if (!canScroll) return;

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const nextScrollTop = Math.max(0, Math.min(maxScrollTop, container.scrollTop + event.deltaY));
    container.scrollTop = nextScrollTop;
  }, []);

  const pushLocalAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `local-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sender_role: "assistant",
        sender_label: "SheetalDharshan Assistant",
        content,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const isLocalVisitorSynced = useCallback((localMessage: AssistantMessage, serverMessages: AssistantMessage[]) => {
    if (localMessage.sender_role !== "visitor") return false;
    const localContent = (localMessage.content || "").trim();
    if (!localContent) return false;

    const localCreatedAt = new Date(localMessage.created_at).getTime();
    return serverMessages.some((serverMessage) => {
      if (serverMessage.sender_role !== "visitor") return false;
      if ((serverMessage.content || "").trim() !== localContent) return false;

      const serverCreatedAt = new Date(serverMessage.created_at).getTime();
      if (!Number.isFinite(localCreatedAt) || !Number.isFinite(serverCreatedAt)) return true;

      return Math.abs(serverCreatedAt - localCreatedAt) <= 3 * 60 * 1000;
    });
  }, []);

  const classifyNavigationConfirmation = useCallback(async (message: string) => {
    try {
      const response = await fetch("/api/assistant/confirm-navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        return classifyConfirmationFallback(message);
      }

      const data = await response.json();
      const decision = String(data?.decision || "unclear").toLowerCase();
      if (decision === "confirm" || decision === "reject" || decision === "unclear") {
        return decision;
      }

      return classifyConfirmationFallback(message);
    } catch {
      return classifyConfirmationFallback(message);
    }
  }, []);

  const jumpToSection = useCallback((sectionId: string) => {
    if (typeof window === "undefined") return;

    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.location.assign(`/#${sectionId}`);
  }, []);

  const navigateForIntent = useCallback(
    (target: AssistantIntentTarget) => {
      setNavigationNotice(target.notice);

      if (target.kind === "route") {
        router.push(target.value);
        return;
      }

      if (pathname === "/") {
        jumpToSection(target.value);
        return;
      }

      window.location.assign(`/#${target.value}`);
    },
    [jumpToSection, pathname, router]
  );

  useEffect(() => {
    if (!navigationNotice) return;

    const timeoutId = window.setTimeout(() => {
      setNavigationNotice(null);
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [navigationNotice]);

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

        const latestOperatorMessage = [...nextMessages].reverse().find((message) => message.sender_role === "operator");
        if (latestOperatorMessage && latestOperatorMessage.id !== latestOperatorNavigationIdRef.current) {
          const operatorIntent = resolveCommandTarget(latestOperatorMessage.content || "");
          if (operatorIntent) {
            latestOperatorNavigationIdRef.current = latestOperatorMessage.id;
            navigateForIntent(operatorIntent);
          }
        }

        setMessages((prev) => {
          const localTransient = prev.filter(
            (item) =>
              item.id.startsWith("local-assistant-") ||
              item.id.startsWith("local-system-") ||
              item.id.startsWith("local-visitor-")
          );

          if (localTransient.length === 0) {
            return [...nextMessages].sort(byCreatedAtAsc);
          }

          const serverIds = new Set(nextMessages.map((item) => item.id));
          const stillLocal = localTransient.filter((item) => {
            if (serverIds.has(item.id)) return false;
            if (item.id.startsWith("local-visitor-")) {
              return !isLocalVisitorSynced(item, nextMessages);
            }
            return true;
          });
          return [...nextMessages, ...stillLocal].sort(byCreatedAtAsc);
        });
      } catch {
        // Ignore fetch errors and continue polling.
      }
    },
    [isLocalVisitorSynced, isOpen, navigateForIntent]
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
    try {
      const storedSize = localStorage.getItem(WIDGET_SIZE_KEY);
      if (!storedSize) return;

      const parsed = JSON.parse(storedSize) as { width?: unknown; height?: unknown };
      const nextWidth = typeof parsed.width === "number" ? parsed.width : DEFAULT_WIDGET_WIDTH;
      const nextHeight = typeof parsed.height === "number" ? parsed.height : DEFAULT_WIDGET_HEIGHT;
      setWidgetSize(clampWidgetSize(nextWidth, nextHeight));
    } catch {
      // Ignore malformed local storage values.
    }
  }, [clampWidgetSize]);

  useEffect(() => {
    try {
      localStorage.setItem(WIDGET_SIZE_KEY, JSON.stringify(widgetSize));
    } catch {
      // Ignore storage write errors.
    }
  }, [widgetSize]);

  useEffect(() => {
    const syncSizeToViewport = () => {
      setWidgetSize((prev) => clampWidgetSize(prev.width, prev.height));
    };

    syncSizeToViewport();
    window.addEventListener("resize", syncSizeToViewport);
    return () => {
      window.removeEventListener("resize", syncSizeToViewport);
    };
  }, [clampWidgetSize]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (resizePointerIdRef.current !== null && event.pointerId !== resizePointerIdRef.current) {
        return;
      }

      const start = resizeStartRef.current;
      if (!start) return;

      const nextWidth = start.width + (event.clientX - start.x) * resizeDirectionRef.current.x;
      const nextHeight = start.height + (event.clientY - start.y) * resizeDirectionRef.current.y;
      setWidgetSize(clampWidgetSize(nextWidth, nextHeight));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      resizePointerIdRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = resizeCursor;
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [clampWidgetSize, isResizing, resizeCursor]);

  const handleResizeStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    cursor: "nesw-resize" | "nwse-resize",
    direction: { x: 1 | -1; y: 1 | -1 }
  ) => {
    event.preventDefault();
    event.stopPropagation();
    resizePointerIdRef.current = event.pointerId;
    setResizeCursor(cursor);
    resizeDirectionRef.current = direction;

    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: widgetSize.width,
      height: widgetSize.height,
    };

    setIsResizing(true);
  };

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
    const storedConfirmed = localStorage.getItem(VISITOR_PROFILE_CONFIRMED_KEY) === "true";
    setVisitorName(storedName);
    setVisitorEmail(storedEmail);
    setIsProfileConfirmed(storedConfirmed && !!storedName && !!storedEmail);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const widget = widgetRef.current;
      if (!widget) return;
      if (!widget.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

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
    if (!canSubmitProfile) return;

    localStorage.setItem(VISITOR_NAME_KEY, trimmedName);
    localStorage.setItem(VISITOR_EMAIL_KEY, trimmedEmail);
    localStorage.setItem(VISITOR_PROFILE_CONFIRMED_KEY, "true");

    setIsProfileConfirmed(true);
    setIsEditingProfile(false);
    const nextConversation = await ensureConversation({ name: trimmedName, email: trimmedEmail });
    if (nextConversation?.id) {
      await loadMessages(nextConversation.id, { silent: true });
    }
  };

  const sendMessage = async (content: string, conversationId: string) => {
    if (!conversationId || (!content.trim() && pendingAttachments.length === 0)) return;

    const trimmedContent = content.trim();
    let shouldSkipAiResponse = false;
    const nowIso = new Date().toISOString();
    const optimisticVisitorMessage: AssistantMessage = {
      id: `local-visitor-${Date.now()}`,
      sender_role: "visitor",
      sender_label: visitorName || "You",
      content: trimmedContent,
      created_at: nowIso,
      attachments: pendingAttachments,
    };

    setMessages((prev) => [...prev, optimisticVisitorMessage]);

    if (pendingNavigationTarget && pendingAttachments.length === 0) {
      const decision = await classifyNavigationConfirmation(trimmedContent);

      if (decision === "confirm") {
        navigateForIntent(pendingNavigationTarget);
        setPendingNavigationTarget(null);
        shouldSkipAiResponse = true;
      } else if (decision === "reject") {
        pushLocalAssistantMessage("Okay, I will stay on this page. If you want later, just ask me again.");
        setPendingNavigationTarget(null);
        return;
      } else {
        setPendingNavigationTarget(null);
      }
    }

    const matchedIntent = pendingAttachments.length === 0 ? resolveIntentTarget(trimmedContent) : null;
    if (matchedIntent) {
      setPendingNavigationTarget(matchedIntent);
      const targetLabel = matchedIntent.kind === "section" ? "section" : "page";
      pushLocalAssistantMessage(`${matchedIntent.reply} If you need, I can move you to that ${targetLabel}.`);
      shouldSkipAiResponse = true;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/assistant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: trimmedContent,
          senderRole: "visitor",
          language: "en",
          skipAiResponse: shouldSkipAiResponse,
          attachments: pendingAttachments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const persistedMessages = [data?.message, data?.assistantMessage].filter(Boolean) as AssistantMessage[];
        setMessages((prev) => {
          if (persistedMessages.length === 0) {
            return prev;
          }
          return [...prev.filter((item) => item.id !== optimisticVisitorMessage.id), ...persistedMessages].sort(byCreatedAtAsc);
        });
        setPendingAttachments([]);
      } else {
        pushLocalAssistantMessage("I am syncing that message now. If the response is delayed, it will appear shortly.");
      }
    } catch {
      pushLocalAssistantMessage("Network seems slow right now. Your message is kept and will sync automatically.");
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

    let activeConversationId = conversation?.id || "";

    if (!activeConversationId) {
      const nextConversation = await ensureConversation();
      if (!nextConversation?.id) return;
      activeConversationId = nextConversation.id;
    }

    await sendMessage(payload, activeConversationId);
  };

  const handleOpen = async () => {
    setIsOpen((prev) => !prev);

    if (!conversation?.id && hasVisitorProfile && isProfileConfirmed) {
      const nextConversation = await ensureConversation();
      if (nextConversation?.id) {
        await loadMessages(nextConversation.id, { silent: true });
      }
    }
  };

  return (
    <div ref={widgetRef} className="fixed bottom-4 right-4 z-[95] md:bottom-6 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              width: widgetSize.width,
              height: widgetSize.height,
              maxWidth: "calc(100vw - 1.5rem)",
              maxHeight: "calc(100svh - 5.5rem)",
            }}
            className={cn(
              "relative mb-3 ml-auto flex flex-col overflow-hidden rounded-[26px] border border-foreground/10 bg-background/95 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl",
              isResizing && "select-none"
            )}
          >
            <div className="flex items-center justify-between border-b border-foreground/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">SheetalDharshan Assistant</p>
                  <p className="text-[11px] text-foreground/55">
                    <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-amber-500")} />
                    {isOnline ? "Online now" : "Trying to reconnect"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isProfileConfirmed && !isEditingProfile && (
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

            {!isProfileConfirmed || isEditingProfile ? (
              <div className="overflow-y-auto p-3.5">
                <div className="space-y-3">
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
                  className="h-9 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40"
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
                  className="h-9 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleProfileSubmit}
                  disabled={!canSubmitProfile}
                  className="h-9 w-full rounded-xl bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="h-9 w-full rounded-xl border border-foreground/15 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                  >
                    Cancel
                  </button>
                )}
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={listRef}
                  onWheel={handleMessageListWheel}
                  className="assistant-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2.5"
                >
                  {messages.length === 0 && (
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-3 py-2 text-xs text-foreground/70">
                      Hi {visitorName || "there"}, ask anything about Sheetal. AI replies instantly, and Sheetal can jump in anytime.
                    </div>
                  )}
                  {messages.map((message) => {
                    const isVisitor = message.sender_role === "visitor";
                    const displayContent = sanitizeMessageContent(message.content || "");
                    return (
                      <div key={message.id} className={cn("flex w-full", isVisitor ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-[13px]",
                            isVisitor
                              ? "rounded-br-md bg-foreground text-background"
                              : "rounded-bl-md border border-foreground/10 bg-foreground/[0.03] text-foreground"
                          )}
                        >
                          {!isVisitor && <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-foreground/45">{message.sender_label}</p>}
                          {displayContent && <p className="whitespace-pre-wrap leading-5">{displayContent}</p>}
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
                  {navigationNotice && (
                    <div className="mb-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                      {navigationNotice}
                    </div>
                  )}
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
                  <div className="flex items-center gap-1.5 rounded-2xl border border-foreground/15 bg-background px-2 py-1">
                    <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground">
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                      <Paperclip className="h-3.5 w-3.5" />
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
                      className="h-8 w-full bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-foreground/35"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isSending || isUploadingAttachment || (inputValue.trim().length === 0 && pendingAttachments.length === 0)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-all disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              onPointerDown={(event) => handleResizeStart(event, "nwse-resize", { x: -1, y: -1 })}
              className="absolute left-2 top-2 z-10 flex h-4 w-4 touch-none items-center justify-center rounded-md border border-foreground/15 bg-background/75 text-foreground/55 transition-colors hover:border-foreground/25 hover:text-foreground cursor-nwse-resize"
              aria-label="Resize assistant from top"
              title="Drag to resize"
            >
              <span className="pointer-events-none text-[8px] leading-none">↖</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleOpen}
        className="group relative ml-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-foreground text-background shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
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

      <style jsx global>{`
        .assistant-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(120, 120, 130, 0.65) transparent;
        }

        .assistant-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .assistant-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .assistant-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(120, 120, 130, 0.85), rgba(80, 80, 90, 0.8));
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .assistant-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(150, 150, 165, 0.95), rgba(96, 96, 112, 0.9));
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
};
