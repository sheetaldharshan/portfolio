"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ExternalLink, Sun, Moon, House, Search, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import persona from "@/data/persona.json";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/registry/magicui/shine-border";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ChatProject {
    title: string;
    description: string;
    tags: string[];
    link?: string;
    image_url?: string;
}

interface Message {
    id: string;
    type: "bot" | "user";
    text: string;
    timestamp: Date;
    projects?: ChatProject[];
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    lastUpdated: Date;
}

interface ChatBotProps {
    isHeroVariant?: boolean;
}

interface ShowcaseItem {
    id: string;
    title: string;
    subtitle: string;
    url: string;
}

const INITIAL_CHAT_TIMESTAMP = "2026-01-01T00:00:00.000Z";
const INITIAL_SESSION_ID = "session-initial";
const INITIAL_WELCOME_ID = "welcome-initial";

const showcaseItems: ShowcaseItem[] = [
    { id: "work", title: "Project Showcase", subtitle: "Featured builds", url: "/work" },
    { id: "blog", title: "Blog", subtitle: "Thoughts and notes", url: "/blog" },
    { id: "hire", title: "Hire Me", subtitle: "Services and process", url: "/hire-me" },
];

const formatClockTime = (timestamp: Date, hydrated: boolean) => {
    if (!hydrated) return "";
    return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(timestamp);
};

const createWelcomeMessage = (): Message => ({
    id: INITIAL_WELCOME_ID,
    type: "bot",
    text: `Hi👋, Ask me anything about **${persona.name}** ...`,
    timestamp: new Date(INITIAL_CHAT_TIMESTAMP),
});

const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing-1" />
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing-2" />
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing-3" />
    </div>
);

const ChatProjectCard = ({
    project,
    index,
    onOpenInPreview,
}: {
    project: ChatProject;
    index: number;
    onOpenInPreview?: (url: string, title?: string) => void;
}) => (
    <motion.a
        href={project.link || "#"}
        target={project.link ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={(event) => {
            if (onOpenInPreview && project.link) {
                event.preventDefault();
                onOpenInPreview(project.link, project.title);
            }
        }}
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, delay: index * 0.1, ease: "easeOut" }}
        className="group block rounded-xl overflow-hidden border border-foreground/[0.08] bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
    >
        {/* Image */}
        <div className="relative h-28 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
            {project.image_url ? (
                <Image
                    src={project.image_url + "?auto=format&fit=crop&q=80&w=400"}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
            )}
            {/* Link indicator */}
            {project.link && (
                <div className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center border border-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                </div>
            )}
        </div>

        {/* Content */}
        <div className="p-3">
            <h4 className="text-sm font-display font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {project.title}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                {project.description}
            </p>
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
                {project.tags?.slice(0, 3).map((tag) => (
                    <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[9px] font-mono font-medium bg-primary/10 text-primary/80 border border-primary/10"
                    >
                        {tag}
                    </span>
                ))}
                {project.tags && project.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono text-muted-foreground">
                        +{project.tags.length - 3}
                    </span>
                )}
            </div>
        </div>
    </motion.a>
);

const formatMessage = (text: string) => {
    // Remove the [SHOW_PROJECTS] marker from displayed text
    const cleanText = text.replace(/\[SHOW_PROJECTS\]/g, "").trim();
    if (!cleanText) return null;

    return cleanText.split("\n").map((line, i) => {
        // Bold text
        const boldParsed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
        // Links
        const linkParsed = boldParsed.replace(
            /\[(.*?)\]\((.*?)\)/g,
            '<a href="$2" class="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors">$1</a>'
        );

        if (line.startsWith("**") && line.includes(":**")) {
            return (
                <div key={i} className="mt-2 first:mt-0" dangerouslySetInnerHTML={{ __html: linkParsed }} />
            );
        }

        if (line.match(/^[✅🎵📊🤖🌐🏢🚀💡🌍🎮☕🌙📚🎯]/)) {
            return (
                <div key={i} className="flex items-start gap-2 mt-1 ml-1" dangerouslySetInnerHTML={{ __html: linkParsed }} />
            );
        }

        return (
            <div key={i} className={cn(line === "" ? "h-2" : "mt-1 first:mt-0")} dangerouslySetInnerHTML={{ __html: linkParsed }} />
        );
    });
};

export const ChatBot = ({ isHeroVariant = false }: ChatBotProps) => {
    const router = useRouter();
    const [hasHydrated, setHasHydrated] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        const initialSession: ChatSession = {
            id: INITIAL_SESSION_ID,
            title: "New Chat",
            messages: [createWelcomeMessage()],
            createdAt: new Date(INITIAL_CHAT_TIMESTAMP),
            lastUpdated: new Date(INITIAL_CHAT_TIMESTAMP)
        };
        return [initialSession];
    });
    const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || INITIAL_SESSION_ID);
    const [isTyping, setIsTyping] = useState(false);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const [language, setLanguage] = useState("en");
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [previewUrl, setPreviewUrl] = useState(showcaseItems[0].url);
    const [previewTitle, setPreviewTitle] = useState(showcaseItems[0].title);
    const [browserAddress, setBrowserAddress] = useState(showcaseItems[0].url);
    const [browserHistory, setBrowserHistory] = useState<string[]>([showcaseItems[0].url]);
    const [browserHistoryIndex, setBrowserHistoryIndex] = useState(0);
    const [iframeReloadKey, setIframeReloadKey] = useState(0);
    const [isXlViewport, setIsXlViewport] = useState(false);
    const [browserDarkMode, setBrowserDarkMode] = useState(true);
    const [rightPanelWidth, setRightPanelWidth] = useState(530);
    const [isResizingRightPanel, setIsResizingRightPanel] = useState(false);
    const [isMiddleScrollEnabled, setIsMiddleScrollEnabled] = useState(false);
    const [isRightPanelHeaderVisible, setIsRightPanelHeaderVisible] = useState(true);
    const [isRightPanelLoading, setIsRightPanelLoading] = useState(true);
    const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);
    const rightPanelLastScrollTopRef = useRef(0);
    const rightPanelScrollCleanupRef = useRef<(() => void) | null>(null);
    const rightPanelScrollIdleTimeoutRef = useRef<number | null>(null);
    const browserIframeRef = useRef<HTMLIFrameElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const container = chatContainerRef.current;
            if (!container) return;
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
            setShowScrollIndicator(!isAtBottom);
        };

        const container = chatContainerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Small timeout to allow DOM to update before scrolling
        const timeoutId = setTimeout(() => {
            scrollToBottom();
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [sessions, activeSessionId, isTyping]);

    const scrollToLatestMessage = () => {
        scrollToBottom();
        setShowScrollIndicator(false);
    };

    const handleMiddleScrollWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        if (!isMiddleScrollEnabled) return;
        event.stopPropagation();
    };

    useEffect(() => {
        if (!isResizingRightPanel) return;

        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        return () => {
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
        };
    }, [isResizingRightPanel]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 1280px)");
        const updateViewport = () => setIsXlViewport(mediaQuery.matches);

        updateViewport();
        mediaQuery.addEventListener("change", updateViewport);

        return () => {
            mediaQuery.removeEventListener("change", updateViewport);
        };
    }, []);

    useEffect(() => {
        router.prefetch("/work");
        router.prefetch("/blog");
    }, [router]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "error-page-action") {
                if (event.data.action === "go-back") {
                    // Try to go back in browser history, otherwise go to work page
                    if (browserHistoryIndex > 0) {
                        const nextIndex = browserHistoryIndex - 1;
                        const nextUrl = browserHistory[nextIndex];
                        setBrowserHistoryIndex(nextIndex);
                        navigateBrowserTo(nextUrl, previewTitle, false);
                    } else {
                        navigateBrowserTo("/work", "Project Showcase", true);
                    }
                } else if (event.data.action === "home") {
                    navigateBrowserTo("/work", "Project Showcase", true);
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [browserHistoryIndex, browserHistory, previewTitle]);

    const askGroq = async (userText: string, lang: string, history: Message[]): Promise<{ content: string; projects?: ChatProject[] }> => {
        try {
            const formattedHistory = history.map(m => ({
                role: m.type === "bot" ? "assistant" : "user",
                content: m.text
            }));

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...formattedHistory, { role: "user", content: userText }],
                    language: lang
                })
            });

            const data = await response.json();
            return {
                content: data.content || "I'm having a bit of trouble connecting to my brain right now. Please try again!",
                projects: data.projects
            };
        } catch (error) {
            console.error("Chat Error:", error);
            return { content: "Something went wrong. Let's try that again!" };
        }
    };

    const handleQuestion = async (questionId: string, questionLabel: string) => {
        const activeSession = sessions.find(s => s.id === activeSessionId);
        if (!activeSession) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            type: "user",
            text: questionLabel,
            timestamp: new Date(),
        };
        const newHistory = [...activeSession.messages, userMsg];
        
        setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
                ? { ...s, messages: newHistory, lastUpdated: new Date(), title: s.title === "New Chat" ? questionLabel.substring(0, 30) : s.title }
                : s
        ));
        setIsTyping(true);

        const { content, projects } = await askGroq(questionLabel, language, activeSession.messages);

        setIsTyping(false);
        const botMsg: Message = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: content,
            timestamp: new Date(),
            projects,
        };
        
        setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
                ? { ...s, messages: [...newHistory, botMsg], lastUpdated: new Date() }
                : s
        ));
    };

    const handleCustomInput = async () => {
        if (!inputValue.trim()) return;

        const activeSession = sessions.find(s => s.id === activeSessionId);
        if (!activeSession) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            type: "user",
            text: inputValue,
            timestamp: new Date(),
        };
        const newHistory = [...activeSession.messages, userMsg];
        const currentInput = inputValue;
        
        setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
                ? { ...s, messages: newHistory, lastUpdated: new Date(), title: s.title === "New Chat" ? currentInput.substring(0, 30) : s.title }
                : s
        ));
        setInputValue("");
        setIsTyping(true);

        const { content, projects } = await askGroq(currentInput, language, activeSession.messages);

        setIsTyping(false);
        const botMsg: Message = {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: content,
            timestamp: new Date(),
            projects,
        };
        
        setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
                ? { ...s, messages: [...newHistory, botMsg], lastUpdated: new Date() }
                : s
        ));
    };

    const startNewSession = () => {
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: "New Chat",
            messages: [createWelcomeMessage()],
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setInputValue("");
        setIsTyping(false);
    };

    const switchSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
        setInputValue("");
        setIsTyping(false);
    };

    const resolveBrowserInput = (value: string) => {
        const raw = value.trim();
        if (!raw) return previewUrl;

        if (/^https?:\/\//i.test(raw)) return raw;
        if (raw.startsWith("/")) return raw;

        const matchedRoute = showcaseItems.find((item) => item.url.replace(/^\//, "") === raw.toLowerCase());
        if (matchedRoute) return matchedRoute.url;

        if (raw.includes(" ")) return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
        if (raw.includes(".")) return `https://${raw}`;

        return `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
    };

    const syncIframeTheme = () => {
        const iframe = browserIframeRef.current;
        if (!iframe) return;

        try {
            const iframeDoc = iframe.contentDocument;
            if (!iframeDoc?.documentElement) return;
            iframeDoc.documentElement.classList.toggle("dark", browserDarkMode);
        } catch {
            // Cross-origin pages cannot be themed from parent context.
        }
    };

    const normalizeBrowserUrl = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return "";
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith("/")) return trimmed;
        if (/\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
        return `/${trimmed.replace(/^\/+/, "")}`;
    };

    const toAbsoluteBrowserUrl = (url: string) => {
        try {
            return new URL(url, window.location.origin).toString();
        } catch {
            return url;
        }
    };

    const toProxyBrowserUrl = (url: string) => `/api/browser-proxy?url=${encodeURIComponent(url)}`;

    const toBrowserErrorPageUrl = (title: string, description: string) =>
        `/api/browser-proxy?mode=error&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

    const showcaseAllowedHostPatterns = [
        "hexoran.com",
        "*.hexoran.com",
        ...(process.env.NEXT_PUBLIC_BROWSER_PANEL_ALLOWED_HOSTS || "")
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean),
    ];

    const hostMatchesPattern = (hostname: string, pattern: string) => {
        const host = hostname.toLowerCase();
        const normalized = pattern.toLowerCase();

        if (normalized.startsWith("*.")) {
            const base = normalized.slice(2);
            return host === base || host.endsWith(`.${base}`);
        }

        return host === normalized || host.endsWith(`.${normalized}`);
    };

    const isShowcaseAllowedExternalUrl = (url: string) => {
        try {
            const parsed = new URL(url, window.location.origin);
            if (!/^https?:$/i.test(parsed.protocol)) return false;
            if (parsed.hostname === window.location.hostname) return true;
            return showcaseAllowedHostPatterns.some((pattern) => hostMatchesPattern(parsed.hostname, pattern));
        } catch {
            return false;
        }
    };

    const isKnownBlockedEmbedExternalUrl = (url: string) => {
        try {
            const parsed = new URL(url, window.location.origin);
            const host = parsed.hostname.toLowerCase();
            return (
                host === "google.com" ||
                host.endsWith(".google.com") ||
                host === "duckduckgo.com" ||
                host.endsWith(".duckduckgo.com") ||
                host === "vercel.com" ||
                host.endsWith(".vercel.com") ||
                host === "vercel.app"
            );
        } catch {
            return false;
        }
    };

    const fromProxyBrowserUrl = (url: string) => {
        try {
            const parsed = new URL(url, window.location.origin);
            if (parsed.pathname !== "/api/browser-proxy") return null;
            return parsed.searchParams.get("url");
        } catch {
            return null;
        }
    };

    const isExternalBrowserUrl = (url: string) => /^https?:\/\//i.test(url);

    const navigateBrowserTo = (url: string, title?: string, pushHistory = true) => {
        if (!url) return;

        setIsRightPanelLoading(true);

        let nextPreviewUrl = url;
        let nextAddress = url;

        if (isExternalBrowserUrl(url)) {
            const absoluteUrl = toAbsoluteBrowserUrl(url);
            nextAddress = absoluteUrl;

            if (isShowcaseAllowedExternalUrl(absoluteUrl)) {
                if (isKnownBlockedEmbedExternalUrl(absoluteUrl)) {
                    nextPreviewUrl = toProxyBrowserUrl(absoluteUrl);
                } else {
                    nextPreviewUrl = absoluteUrl;
                }
            } else {
                nextPreviewUrl = toBrowserErrorPageUrl(
                    "Showcase-only Panel",
                    "Only Sheetal showcases can be shown here."
                );
            }
        }

        setPreviewUrl(nextPreviewUrl);
        if (title) setPreviewTitle(title);
        setBrowserAddress(nextAddress);

        if (pushHistory) {
            setBrowserHistory((prev) => {
                const truncated = prev.slice(0, browserHistoryIndex + 1);
                if (truncated[truncated.length - 1] === nextAddress) return truncated;
                const next = [...truncated, nextAddress];
                setBrowserHistoryIndex(next.length - 1);
                return next;
            });
        }

    };

    const syncBrowserStateFromIframe = () => {
        if (!isHeroVariant) return;

        try {
            const iframe = browserIframeRef.current;
            if (!iframe?.contentWindow) return;
            const iframeUrl = iframe.contentWindow.location.href;
            const decodedTarget = fromProxyBrowserUrl(iframeUrl);
            if (!decodedTarget) return;

            setPreviewUrl(toProxyBrowserUrl(decodedTarget));

            const shouldPush = decodedTarget !== browserAddress;
            setBrowserAddress(decodedTarget);

            if (shouldPush) {
                setBrowserHistory((prev) => {
                    if (prev[prev.length - 1] === decodedTarget) return prev;
                    const next = [...prev, decodedTarget];
                    setBrowserHistoryIndex(next.length - 1);
                    return next;
                });
            }
        } catch {
            // Ignore iframe access issues.
        }
    };

    const handleBrowserIframeLoad = () => {
        syncIframeTheme();
        syncBrowserStateFromIframe();

        rightPanelScrollCleanupRef.current?.();
        if (rightPanelScrollIdleTimeoutRef.current) {
            window.clearTimeout(rightPanelScrollIdleTimeoutRef.current);
            rightPanelScrollIdleTimeoutRef.current = null;
        }

        try {
            const iframeWindow = browserIframeRef.current?.contentWindow;
            const iframeDocument = browserIframeRef.current?.contentDocument;
            if (!iframeWindow || !iframeDocument) {
                setIsRightPanelLoading(false);
                setIsRightPanelHeaderVisible(true);
                return;
            }

            const getScrollTop = () => iframeWindow.scrollY || iframeDocument.documentElement.scrollTop || iframeDocument.body.scrollTop || 0;

            rightPanelLastScrollTopRef.current = getScrollTop();
            setIsRightPanelHeaderVisible(getScrollTop() <= 8);

            const handlePreviewScroll = () => {
                const currentScrollTop = getScrollTop();
                setIsRightPanelHeaderVisible(false);

                if (rightPanelScrollIdleTimeoutRef.current) {
                    window.clearTimeout(rightPanelScrollIdleTimeoutRef.current);
                }

                rightPanelScrollIdleTimeoutRef.current = window.setTimeout(() => {
                    setIsRightPanelHeaderVisible(getScrollTop() <= 8);
                    rightPanelScrollIdleTimeoutRef.current = null;
                }, 140);

                rightPanelLastScrollTopRef.current = currentScrollTop;
            };

            iframeWindow.addEventListener("scroll", handlePreviewScroll, { passive: true });
            rightPanelScrollCleanupRef.current = () => {
                iframeWindow.removeEventListener("scroll", handlePreviewScroll);
            };
            setIsRightPanelLoading(false);
        } catch {
            setIsRightPanelLoading(false);
            setIsRightPanelHeaderVisible(true);
            rightPanelScrollCleanupRef.current = null;
        }
    };

    const handleBrowserIframeError = () => {
        setIsRightPanelLoading(false);
        setPreviewUrl(
            toBrowserErrorPageUrl(
                "Unable to Load Showcase",
                "Sorry for the inconvenience. The selected showcase page is currently unreachable."
            )
        );
    };

    const openInPreview = (url: string, title?: string) => {
        const normalized = normalizeBrowserUrl(url);
        if (rightPanelScrollIdleTimeoutRef.current) {
            window.clearTimeout(rightPanelScrollIdleTimeoutRef.current);
            rightPanelScrollIdleTimeoutRef.current = null;
        }
        setIsRightPanelHeaderVisible(true);
        navigateBrowserTo(normalized, title, true);
    };

    const handleMessageContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isHeroVariant) return;
        const target = event.target as HTMLElement;
        const anchor = target.closest("a") as HTMLAnchorElement | null;
        if (!anchor) return;
        const href = anchor.getAttribute("href") || anchor.href;
        if (!href) return;
        event.preventDefault();
        openInPreview(href, anchor.textContent || "Preview");
    };

    const handleRightPanelResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isHeroVariant || window.innerWidth < 1280) return;

        event.preventDefault();
        resizeStartRef.current = {
            startX: event.clientX,
            startWidth: rightPanelWidth,
        };
        setIsResizingRightPanel(true);
    };

    const handleRightPanelResizeMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isResizingRightPanel || !resizeStartRef.current) return;

        const { startX, startWidth } = resizeStartRef.current;
        const deltaX = startX - event.clientX;
        const nextWidth = Math.min(820, Math.max(420, startWidth + deltaX));
        setRightPanelWidth(nextWidth);
    };

    const handleRightPanelResizeEnd = () => {
        setIsResizingRightPanel(false);
        resizeStartRef.current = null;
    };

    const handleBrowserGo = () => {
        const normalized = resolveBrowserInput(browserAddress);
        if (!normalized) return;
        navigateBrowserTo(normalized, previewTitle, true);
    };

    const handleBrowserBack = () => {
        if (browserHistoryIndex <= 0) return;
        const nextIndex = browserHistoryIndex - 1;
        const nextUrl = browserHistory[nextIndex];
        setBrowserHistoryIndex(nextIndex);
        navigateBrowserTo(nextUrl, previewTitle, false);
    };

    const handleBrowserForward = () => {
        if (browserHistoryIndex >= browserHistory.length - 1) return;
        const nextIndex = browserHistoryIndex + 1;
        const nextUrl = browserHistory[nextIndex];
        setBrowserHistoryIndex(nextIndex);
        navigateBrowserTo(nextUrl, previewTitle, false);
    };

    const handleBrowserReload = () => {
        setIframeReloadKey((prev) => prev + 1);
    };

    const handleBrowserThemeToggle = () => {
        setBrowserDarkMode((prev) => !prev);
    };

    useEffect(() => {
        syncIframeTheme();
    }, [browserDarkMode, previewUrl, iframeReloadKey]);

    useEffect(() => {
        return () => {
            rightPanelScrollCleanupRef.current?.();
            if (rightPanelScrollIdleTimeoutRef.current) {
                window.clearTimeout(rightPanelScrollIdleTimeoutRef.current);
            }
        };
    }, []);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const messages = activeSession?.messages || [createWelcomeMessage()];
    const browserDisplayUrl = previewUrl.startsWith("http")
        ? previewUrl
        : `http://localhost:3000${previewUrl}`;

    const formatTimeAgo = (timestamp: Date) => {
        if (!hasHydrated) return "";
        const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 60000));
        if (diffMinutes < 1) return "now";
        if (diffMinutes < 60) return `${diffMinutes}m`;
        const hours = Math.floor(diffMinutes / 60);
        return `${hours}h`;
    };

    const currentLang = persona.languages.find((l) => l.code === language);
    const heroGridStyle = {
        ["--chat-right-width" as string]: `${rightPanelWidth}px`,
    } as React.CSSProperties;

    return (
        <div className={cn("w-full mx-auto transition-all duration-500 min-h-0", isHeroVariant ? "max-w-none flex flex-col" : "max-w-md")} style={isHeroVariant ? { height: "72vh", minHeight: "420px", maxHeight: "760px" } : {}}>
            {/* Avatar Section */}
            {!isHeroVariant && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center mb-6"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                        <div className="relative w-20 h-20 rounded-full bg-background flex items-center justify-center overflow-hidden border border-foreground/10">
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
                                <span className="text-3xl font-display font-bold text-foreground tracking-tighter">SD</span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-[3px] border-background shadow-lg" />
                    </div>
                    <motion.p className="mt-4 text-sm font-bold text-foreground tracking-tight font-display">{persona.name}</motion.p>
                    <motion.p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold flex items-center gap-1.5 opacity-80">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Neural Interface Online
                    </motion.p>
                </motion.div>
            )}

            {/* Main Chat Interface */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative overflow-hidden flex flex-col rounded-3xl border-2 border-[#A07CFE]/70 bg-background/40 backdrop-blur-xl shadow-2xl shadow-[#A07CFE]/20 min-h-0",
                    isHeroVariant ? "flex-1" : "shadow-primary/5"
                )}
            >
                {/* Visual Accent - Top Beam */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent z-50" />

                <ShineBorder
                    borderWidth={3}
                    duration={14}
                    shineColor="#A07CFE"
                />

                {!isHeroVariant && <BorderBeam size={350} duration={15} delay={5} colorFrom="#a855f7" colorTo="#06b6d4" />}

                {isHeroVariant && isResizingRightPanel && (
                    <div
                        className="absolute inset-0 z-[90] cursor-col-resize"
                        onMouseMove={handleRightPanelResizeMove}
                        onMouseUp={handleRightPanelResizeEnd}
                        onMouseLeave={handleRightPanelResizeEnd}
                    />
                )}

                {isHeroVariant ? (
                    <div className="h-full min-h-0 flex flex-col bg-[hsl(var(--background)/0.98)]">
                        <div className="h-9 border-b border-foreground/[0.08] px-3 flex items-center justify-between bg-[hsl(var(--muted)/0.5)]">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
                                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/90" />
                                <span className="h-2.5 w-2.5 rounded-full bg-green-500/90" />
                            </div>
                            <p className="text-xs text-foreground/80 tracking-wide">Neural Workspace</p>
                            <a
                                href="/hire-me"
                                className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2 py-0.5 text-[10px] font-medium text-primary/85 transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                                <ArrowUpRight className="h-3 w-3" />
                                Hire Me
                            </a>
                        </div>

                        <div
                            className="grid flex-1 min-h-0 h-0 grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:[grid-template-columns:250px_minmax(0,1fr)_var(--chat-right-width)]"
                            style={heroGridStyle}
                        >
                        <aside className="hidden lg:flex flex-col border-r border-foreground/[0.08] bg-[hsl(var(--muted)/0.3)]">
                            <div className="h-9 px-3 border-b border-foreground/[0.08] flex items-center">
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-foreground/65 uppercase">Chat Sessions ({sessions.length})</p>
                            </div>
                            <div className="p-3 space-y-2 overflow-y-auto">
                                <button
                                    onClick={startNewSession}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-[10px] hover:bg-primary/15 transition-colors"
                                >
                                    + New Chat
                                </button>
                                {sessions.length === 0 ? (
                                    <div className="px-3 py-8 text-center text-xs text-foreground/40">Start chatting to create your first session.</div>
                                ) : (
                                    sessions.map((session) => (
                                        <button
                                            key={session.id}
                                            onClick={() => switchSession(session.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                                                session.id === activeSessionId
                                                    ? "border-primary/40 bg-primary/10"
                                                    : "border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11px] text-foreground/80 line-clamp-1 font-medium">{session.title}</p>
                                                <span className="text-[10px] text-foreground/45 shrink-0">{formatTimeAgo(session.lastUpdated)}</span>
                                            </div>
                                            <p className="mt-1 text-[10px] text-foreground/45 line-clamp-1">{session.messages.length} messages</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </aside>

                        <div className="min-w-0 min-h-0 flex flex-col border-r border-foreground/[0.08] xl:border-r bg-background">
                            <div className="h-9 px-3 border-b border-foreground/[0.08] bg-[hsl(var(--muted)/0.4)] backdrop-blur-xl flex items-center">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] text-foreground/45">Current session</p>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/30">Chat</p>
                                </div>
                            </div>

                            <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
                                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background to-transparent" />
                                <div
                                    ref={chatContainerRef}
                                    onWheel={handleMiddleScrollWheel}
                                    onMouseDown={() => setIsMiddleScrollEnabled(true)}
                                    onMouseLeave={() => setIsMiddleScrollEnabled(false)}
                                    className="chat-middle-scroll flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain touch-pan-y px-3 py-4 md:px-5 md:py-6 scroll-smooth"
                                >
                                    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2.5 pb-4 pt-2">
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {messages.map((msg) => (
                                                <motion.div
                                                    key={msg.id}
                                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className={cn("flex w-full px-1 md:px-2", msg.type === "user" ? "justify-end" : "justify-start")}
                                                >
                                                    <div className={cn("w-full", msg.type === "user" ? "max-w-[88%] md:max-w-[68%]" : "max-w-[min(100%,38rem)]") }>
                                                        <div className={cn("mb-1.5 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em]", msg.type === "user" ? "justify-end text-foreground/35" : "justify-start text-foreground/40")}>
                                                            <span className={cn("inline-flex h-4 items-center rounded-full border px-1.5", msg.type === "user" ? "border-primary/20 bg-primary/10 text-primary/90" : "border-foreground/10 bg-foreground/[0.03] text-foreground/50")}>
                                                                {msg.type === "user" ? "You" : persona.name}
                                                            </span>
                                                            <span suppressHydrationWarning>{formatClockTime(msg.timestamp, hasHydrated)}</span>
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "relative px-3.5 py-2.5 text-[13px] md:text-[14px] leading-6",
                                                                msg.type === "bot"
                                                                    ? "rounded-2xl border border-foreground/10 bg-foreground/[0.025] text-foreground/88 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
                                                                    : "rounded-2xl rounded-br-md bg-foreground text-background shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                                                            )}
                                                        >
                                                        <div className="relative z-10" onClick={handleMessageContentClick}>
                                                            {formatMessage(msg.text)}
                                                            {msg.projects && msg.projects.length > 0 && (
                                                                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                                                                    {msg.projects.map((project, idx) => (
                                                                        <ChatProjectCard key={project.title} project={project} index={idx} onOpenInPreview={openInPreview} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {isTyping && (
                                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start px-1 md:px-2">
                                                <div className="rounded-3xl border border-foreground/10 bg-foreground/[0.025] px-3 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                                                    <TypingIndicator />
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                <div className="bg-transparent px-3 py-2.5 backdrop-blur-md space-y-2 shrink-0 relative md:px-4 md:py-3">
                                    {showScrollIndicator && (
                                        <motion.button
                                            onClick={scrollToLatestMessage}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute -top-10 right-2 md:right-2 z-20 flex items-center justify-center p-0 text-foreground/55 transition-colors hover:text-primary"
                                        >
                                            <span className="text-base leading-none">↓</span>
                                        </motion.button>
                                    )}
                                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: "none" }}>
                                        {persona.suggestedQuestions.map((q) => (
                                            <button
                                                key={q.id}
                                                onClick={() => handleQuestion(q.id, q.label)}
                                                disabled={isTyping}
                                                className={cn(
                                                    "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-300 disabled:opacity-50",
                                                    q.id === "projects"
                                                        ? "border-primary/30 bg-transparent text-primary hover:bg-primary/10"
                                                        : "border-foreground/10 bg-transparent text-foreground/60 hover:text-foreground"
                                                )}
                                            >
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 rounded-2xl border border-foreground/10 bg-transparent px-2.5 py-1.5 md:px-3">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleCustomInput()}
                                            placeholder="make a landing page based on attached docs"
                                            disabled={isTyping}
                                            className="min-h-[30px] w-full bg-transparent px-1 text-[12px] text-foreground placeholder:text-foreground/35 focus:outline-none disabled:opacity-50 md:text-[13px]"
                                        />
                                        <button
                                            onClick={handleCustomInput}
                                            disabled={isTyping || !inputValue.trim()}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-[1.03] disabled:opacity-50"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {isXlViewport && (
                        <aside className="hidden xl:flex flex-col bg-[hsl(var(--muted)/0.3)] border-l border-foreground/[0.08] relative">
                            <div
                                onMouseDown={handleRightPanelResizeStart}
                                className={cn(
                                    "absolute left-0 top-0 h-full w-1.5 -translate-x-1/2 cursor-col-resize transition-colors",
                                    isResizingRightPanel ? "bg-primary/40" : "bg-transparent hover:bg-primary/25"
                                )}
                            />
                            <motion.div
                                initial={false}
                                animate={{
                                    height: isRightPanelHeaderVisible ? 36 : 0,
                                    opacity: isRightPanelHeaderVisible ? 1 : 0,
                                    y: isRightPanelHeaderVisible ? 0 : -10,
                                }}
                                transition={{ duration: 0.05, ease: "easeOut" }}
                                className="overflow-hidden"
                            >
                            <div className="h-9 border-b border-foreground/[0.08] px-3 flex items-center gap-1 bg-[hsl(var(--muted)/0.5)]">
                                <button
                                    onClick={handleBrowserBack}
                                    disabled={browserHistoryIndex <= 0}
                                    className="text-[10px] px-2 py-1.5 rounded-xl text-foreground/60 transition-colors hover:text-foreground disabled:opacity-40"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={handleBrowserForward}
                                    disabled={browserHistoryIndex >= browserHistory.length - 1}
                                    className="text-[10px] px-2 py-1.5 rounded-xl text-foreground/60 transition-colors hover:text-foreground disabled:opacity-40"
                                >
                                    →
                                </button>
                                <button
                                    onClick={handleBrowserReload}
                                    className="text-[10px] px-2 py-1.5 rounded-xl text-foreground/60 transition-colors hover:text-foreground"
                                >
                                    {isRightPanelLoading ? <Spinner className="size-3" /> : "↻"}
                                </button>
                                <button
                                    onClick={() => navigateBrowserTo("/work", "Project Showcase", true)}
                                    className="text-[10px] px-2 py-1.5 rounded-xl text-foreground/60 transition-colors hover:text-foreground"
                                >
                                    <House className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleBrowserThemeToggle}
                                    className="text-[10px] px-2 py-1.5 rounded-xl text-foreground/60 transition-colors hover:text-foreground"
                                >
                                    {browserDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                                </button>

                                <input
                                    value={browserAddress}
                                    onChange={(e) => setBrowserAddress(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleBrowserGo()}
                                    className="ml-1 flex-1 rounded-xl border border-foreground/15 bg-[hsl(var(--muted)/0.6)] px-3 py-1.5 text-[10px] text-foreground/70 outline-none"
                                />
                                <button
                                    onClick={handleBrowserGo}
                                    className="text-[10px] px-2.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary"
                                >
                                    <Search className="w-3 h-3" />
                                </button>
                            </div>
                            </motion.div>

                            <div className="relative flex-1 min-h-0 bg-background">
                                {isRightPanelLoading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/92 backdrop-blur-sm p-6">
                                        <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-[hsl(var(--muted)/0.16)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                                            <div className="flex items-center gap-3">
                                                <Spinner className="size-5 text-primary" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-foreground/85">Loading preview</p>
                                                    <p className="text-xs text-foreground/50">Please wait while the page opens.</p>
                                                </div>
                                            </div>
                                            <div className="mt-5 space-y-3">
                                                <Skeleton className="h-10 w-full rounded-2xl" />
                                                <Skeleton className="h-36 w-full rounded-[22px]" />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Skeleton className="h-20 w-full rounded-[18px]" />
                                                    <Skeleton className="h-20 w-full rounded-[18px]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <iframe
                                    ref={browserIframeRef}
                                    key={iframeReloadKey}
                                    title={previewTitle}
                                    src={previewUrl}
                                    onLoad={handleBrowserIframeLoad}
                                    onError={handleBrowserIframeError}
                                    className={cn("h-full w-full transition-opacity duration-200", isRightPanelLoading ? "opacity-0" : "opacity-100")}
                                />
                            </div>
                        </aside>
                        )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative flex-1 min-h-0 overflow-hidden">
                            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background to-transparent" />
                            <div
                                ref={chatContainerRef}
                                onWheel={handleMiddleScrollWheel}
                                onMouseDown={() => setIsMiddleScrollEnabled(true)}
                                onMouseLeave={() => setIsMiddleScrollEnabled(false)}
                                className="chat-middle-scroll h-[420px] overflow-y-auto overscroll-contain px-3 py-4 md:h-[460px] md:px-5 md:py-6 scroll-smooth"
                            >
                                <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2.5 pb-4 pt-2">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={cn("flex w-full px-1 md:px-2", msg.type === "user" ? "justify-end" : "justify-start")}
                                    >
                                        <div className={cn("w-full", msg.type === "user" ? "max-w-[88%] md:max-w-[68%]" : "max-w-[min(100%,38rem)]")}>
                                            <div className={cn("mb-1.5 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em]", msg.type === "user" ? "justify-end text-foreground/35" : "justify-start text-foreground/40")}>
                                                <span className={cn("inline-flex h-4 items-center rounded-full border px-1.5", msg.type === "user" ? "border-primary/20 bg-primary/10 text-primary/90" : "border-foreground/10 bg-foreground/[0.03] text-foreground/50")}>
                                                    {msg.type === "user" ? "You" : persona.name}
                                                </span>
                                                <span suppressHydrationWarning>{formatClockTime(msg.timestamp, hasHydrated)}</span>
                                            </div>
                                            <div
                                                className={cn(
                                                    "relative px-3.5 py-2.5 text-[13px] md:text-[14px] leading-6",
                                                    msg.type === "bot"
                                                        ? "rounded-2xl border border-foreground/10 bg-foreground/[0.025] text-foreground/88 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
                                                        : "rounded-2xl rounded-br-md bg-foreground text-background shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                                                )}
                                            >
                                            <div className="relative z-10" onClick={handleMessageContentClick}>
                                                {formatMessage(msg.text)}
                                                {msg.projects && msg.projects.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        {msg.projects.map((project, idx) => (
                                                            <ChatProjectCard key={project.title} project={project} index={idx} onOpenInPreview={openInPreview} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isTyping && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-start px-1 md:px-2">
                                    <div className="rounded-3xl border border-foreground/10 bg-foreground/[0.025] px-3 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                                        <TypingIndicator />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-transparent px-3 py-2.5 backdrop-blur-md space-y-2 md:px-4 md:py-3 relative">
                            {showScrollIndicator && (
                                <motion.button
                                    onClick={scrollToLatestMessage}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute -top-10 right-2 md:right-2 z-20 flex items-center justify-center p-0 text-foreground/55 transition-colors hover:text-primary"
                                >
                                    <span className="text-base leading-none">↓</span>
                                </motion.button>
                            )}
                            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 md:flex-wrap md:justify-center md:overflow-visible" style={{ scrollbarWidth: "none" }}>
                                {persona.suggestedQuestions.map((q) => (
                                    <button
                                        key={q.id}
                                        onClick={() => handleQuestion(q.id, q.label)}
                                        disabled={isTyping}
                                        className={cn(
                                            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-300 disabled:opacity-50",
                                            q.id === "projects"
                                                ? "bg-transparent border border-primary/30 text-primary hover:bg-primary/10"
                                                : "bg-transparent border border-foreground/10 text-foreground/60 hover:text-foreground"
                                        )}
                                    >
                                        {q.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 rounded-2xl border border-foreground/10 bg-transparent px-2.5 py-1.5 md:px-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleCustomInput()}
                                        placeholder="Message Neural Interface..."
                                        disabled={isTyping}
                                        className="relative min-h-[30px] w-full bg-transparent px-1 text-[12px] text-foreground placeholder:text-foreground/30 focus:outline-none transition-all disabled:opacity-50 md:text-[13px]"
                                    />
                                </div>
                                <button
                                    onClick={handleCustomInput}
                                    disabled={isTyping || !inputValue.trim()}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};
