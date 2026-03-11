"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SiteAssistantWidget } from "@/components/layout/SiteAssistantWidget";

type AppChromeProps = {
  children: React.ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  React.useEffect(() => {
    if (isAdminRoute) return;
    if (typeof window === "undefined") return;

    const sessionFlagKey = "sd_visit_alert_sent";
    if (sessionStorage.getItem(sessionFlagKey) === "true") return;

    const visitorSessionStorageKey = "sd_visit_session";
    const current = localStorage.getItem(visitorSessionStorageKey);
    const visitorSessionId = current || (window.crypto?.randomUUID ? window.crypto.randomUUID() : `visit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    if (!current) {
      localStorage.setItem(visitorSessionStorageKey, visitorSessionId);
    }

    sessionStorage.setItem(sessionFlagKey, "true");

    fetch("/api/assistant/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorSessionId,
        path: pathname || "/",
        referrer: document.referrer || "direct",
        language: navigator.language || "unknown",
      }),
      keepalive: true,
    }).catch(() => {
      // Silent fail: visit ping should not affect page UX.
    });
  }, [isAdminRoute, pathname]);

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {children}
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <SiteAssistantWidget />}
    </>
  );
}
