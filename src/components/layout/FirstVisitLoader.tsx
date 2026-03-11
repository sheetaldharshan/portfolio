"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";

const FIRST_VISIT_KEY = "sd_first_visit_loader_done";
const roles = ["AI Engineer", "Full Stack Developer", "Creative Technologist", "Product Builder"];

/**
 * Works with the pre-hydration inline <script> in layout.tsx that sets
 * `data-loading` on <html> before React mounts. This prevents any flash.
 */
export function FirstVisitLoader() {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const shouldShow = document.documentElement.hasAttribute("data-loading");
    if (!shouldShow) return;

    setVisible(true);
  }, []);

  /* ── Simulated progress ── */
  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setPercent((p) => {
        if (p >= 100) return 100;
        return Math.min(100, p + (p < 72 ? 5 : 2));
      });
    }, 85);
    return () => window.clearInterval(id);
  }, [visible]);

  /* ── Completion chain (fires exactly once when percent hits 100) ── */
  useEffect(() => {
    if (!visible || percent < 100 || done.current) return;
    done.current = true;

    // 500ms → pill switches from "Loading 100%" to "Welcome"
    const t1 = setTimeout(() => setLoaded(true), 500);
    // 1500ms → trigger the expand transition
    const t2 = setTimeout(() => setClicked(true), 1500);
    // 2500ms → unmount loader, mark done for this session, remove pre-hydration backdrop
    const t3 = setTimeout(() => {
      sessionStorage.setItem(FIRST_VISIT_KEY, "true");
      document.documentElement.removeAttribute("data-loading");
      setVisible(false);
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [visible, percent]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: el } = e;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  }

  if (!visible) return null;

  const marqueeItems = [...roles, ...roles];

  return (
    <>
      <div className="loading-header">
        <div className="loader-title" aria-label="Sheetal Dharshan logo">
          <Logo className="loader-logo" />
        </div>
        <div className={`loaderGame ${clicked ? "loader-out" : ""}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {Array.from({ length: 27 }).map((_, i) => (
                <div className="loaderGame-line" key={i} />
              ))}
            </div>
            <div className="loaderGame-ball" />
          </div>
        </div>
      </div>

      <div className="loading-screen" role="status" aria-live="polite">
        <div className="loading-marquee" aria-hidden="true">
          <div className="loading-marquee-track">
            {marqueeItems.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>

        <div
          className={`loading-wrap ${clicked ? "loading-clicked" : ""} ${loaded ? "loading-ready" : ""}`}
          onMouseMove={handleMouseMove}
        >
          <div className="loading-hover" />
          <div className={`loading-button ${loaded ? "loading-complete" : ""}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box" />
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
