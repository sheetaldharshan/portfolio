"use client";

import { useEffect, useMemo, useState } from "react";

const roleMarquee = ["AI Engineer", "Full Stack Developer", "Creative Technologist", "Product Builder"];

type RouteLoadingScreenProps = {
  mode?: "route" | "intro";
  onComplete?: () => void;
};

export function RouteLoadingScreen({ mode = "route", onComplete }: RouteLoadingScreenProps) {
  const [percent, setPercent] = useState(mode === "intro" ? 0 : 6);
  const [dots, setDots] = useState(".");
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setPercent((prev) => {
        if (mode === "intro") {
          if (prev >= 100) return prev;
          return Math.min(100, prev + (prev < 70 ? 4 : 2));
        }

        if (prev >= 96) return prev;
        return prev + (prev < 72 ? 3 : 1);
      });
    }, mode === "intro" ? 85 : 90);

    const dotsTimer = window.setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : `${prev}.`));
    }, 320);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(dotsTimer);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "intro" || percent < 100 || loaded) return;

    const loadedTimer = window.setTimeout(() => {
      setLoaded(true);
    }, 600);

    const revealTimer = window.setTimeout(() => {
      setIsLoaded(true);
    }, 1600);

    return () => {
      window.clearTimeout(loadedTimer);
      window.clearTimeout(revealTimer);
    };
  }, [loaded, mode, percent]);

  useEffect(() => {
    if (mode !== "intro" || !isLoaded || clicked) return;
    setClicked(true);
  }, [clicked, isLoaded, mode]);

  useEffect(() => {
    if (mode !== "intro" || !clicked) return;

    const finishTimer = window.setTimeout(() => {
      onComplete?.();
    }, 900);

    return () => {
      window.clearTimeout(finishTimer);
    };
  }, [clicked, mode, onComplete]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  const marqueeText = useMemo(() => [...roleMarquee, ...roleMarquee], []);

  if (mode === "intro") {
    return (
      <>
        <div className="loading-header">
          <a href="/#" className="loader-title" aria-label="Home">
            Logo
          </a>
          <div className={`loaderGame ${clicked ? "loader-out" : ""}`}>
            <div className="loaderGame-container">
              <div className="loaderGame-in">
                {Array.from({ length: 27 }).map((_, index) => (
                  <div className="loaderGame-line" key={index} />
                ))}
              </div>
              <div className="loaderGame-ball" />
            </div>
          </div>
        </div>

        <div
          className="loading-screen"
          role="status"
          aria-live="polite"
          aria-label="Loading page"
        >
          <div className="loading-marquee" aria-hidden>
            <div className="loading-marquee-track">
              {marqueeText.map((item, index) => (
                <span key={`${item}-${index}`}>{item}</span>
              ))}
            </div>
          </div>

          <div
            className={`loading-wrap ${clicked ? "loading-clicked" : ""}`}
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
