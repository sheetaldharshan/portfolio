"use client";

import { useEffect, useState } from "react";
import { RouteLoadingScreen } from "@/components/layout/RouteLoadingScreen";

const FIRST_VISIT_LOADING_KEY = "sd_first_visit_loader_done";
const FIRST_VISIT_LOADING_MS = 2200;

export function FirstVisitLoader() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const alreadySeen = localStorage.getItem(FIRST_VISIT_LOADING_KEY) === "true";
    if (alreadySeen) return;

    setIsVisible(true);

    const timeoutId = window.setTimeout(() => {
      localStorage.setItem(FIRST_VISIT_LOADING_KEY, "true");
      setIsVisible(false);
    }, FIRST_VISIT_LOADING_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isVisible) return null;

  return <RouteLoadingScreen />;
}
