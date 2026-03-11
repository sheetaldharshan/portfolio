"use client";

import { useEffect, useMemo, useState } from "react";

const roleMarquee = ["AI Engineer", "Full Stack Developer", "Creative Technologist", "Product Builder"];

export function RouteLoadingScreen() {
  const [percent, setPercent] = useState(6);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setPercent((prev) => {
        if (prev >= 96) return prev;
        return prev + (prev < 72 ? 3 : 1);
      });
    }, 90);

    const dotsTimer = window.setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : `${prev}.`));
    }, 320);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(dotsTimer);
    };
  }, []);

  const marqueeText = useMemo(() => [...roleMarquee, ...roleMarquee], []);

  return (
    <div className="route-loading-screen" role="status" aria-live="polite" aria-label="Loading page">
      <header className="route-loading-header">
        <span className="route-loading-brand">SheetalDharshan</span>
        <div className="route-loader-game" aria-hidden>
          <div className="route-loader-track">
            {Array.from({ length: 24 }).map((_, index) => (
              <span key={index} className="route-loader-line" />
            ))}
          </div>
          <span className="route-loader-ball" />
        </div>
      </header>

      <div className="route-loading-marquee" aria-hidden>
        <div className="route-loading-marquee-track">
          {marqueeText.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <div className="route-loading-shell">
        <div className="route-loading-button">
          <div className="route-loading-progress">
            Loading{dots}
            <strong>{percent}%</strong>
          </div>
          <div className="route-loading-welcome">Welcome</div>
        </div>
      </div>
    </div>
  );
}
