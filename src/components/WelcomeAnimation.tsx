"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Heart, Sparkles } from "lucide-react";

export default function WelcomeAnimation() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const dismissSplash = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowSplash(false);
    }, 550);
  }, []);

  const triggerReplay = () => {
    setIsFadingOut(false);
    setShowSplash(true);
    setReplayKey((k) => k + 1);
  };

  useEffect(() => {
    if (!showSplash) return;

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3100);

    const hideTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3650);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        dismissSplash();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showSplash, replayKey, dismissSplash]);

  return (
    <>
      {/* Persistent Shimmering Top Welcome Ribbon */}
      <div className="bg-slate-950 text-white border-b border-emerald-500/30 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2.5 text-center">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-welcome-heartbeat shrink-0" />
          <button
            type="button"
            onClick={triggerReplay}
            title="Click to replay welcome animation"
            className="text-xs sm:text-sm font-black tracking-[0.18em] uppercase bg-gradient-to-r from-emerald-300 via-amber-200 to-teal-300 bg-clip-text text-transparent animate-welcome-shimmer cursor-pointer hover:opacity-90 transition"
          >
            BE ALIVE, YOU ARE SPECIAL
          </button>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        </div>
      </div>

      {/* Full-Screen Entry Welcome Animation */}
      {showSplash && (
        <div
          key={replayKey}
          onClick={dismissSplash}
          role="dialog"
          aria-label="Welcome message: Be Alive, You Are Special"
          className={`fixed inset-0 z-[100] flex items-center justify-center px-6 overflow-hidden cursor-pointer select-none transition-all duration-500 ${
            isFadingOut
              ? "opacity-0 scale-105 pointer-events-none"
              : "opacity-100 scale-100"
          }`}
          style={{
            background:
              "radial-gradient(circle at 50% 35%, #065f46 0%, #022c22 52%, #020617 100%)",
          }}
        >
          {/* Ambient Animated Glow Orbs */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl animate-welcome-float pointer-events-none" />
          <div
            className="absolute -bottom-28 -right-20 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl animate-welcome-float pointer-events-none"
            style={{ animationDelay: "1.2s" }}
          />
          <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-teal-300/15 blur-2xl animate-pulse pointer-events-none" />

          {/* Center Animated Card */}
          <div className="relative max-w-2xl w-full text-center space-y-6">
            {/* Heartbeat & Sparkles Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-emerald-300/30 backdrop-blur-md shadow-lg animate-welcome-pop">
              <Heart className="w-5 h-5 text-rose-400 fill-rose-400 animate-welcome-heartbeat" />
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-200">
                Warm Welcome
              </span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>

            {/* Main Animated Statement */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight animate-welcome-pop">
              <span className="block bg-gradient-to-r from-white via-amber-200 to-emerald-300 bg-clip-text text-transparent animate-welcome-shimmer drop-shadow-sm">
                BE ALIVE,
              </span>
              <span className="block mt-1 bg-gradient-to-r from-emerald-300 via-amber-300 to-white bg-clip-text text-transparent animate-welcome-shimmer">
                YOU ARE SPECIAL
              </span>
            </h1>

            {/* Uplifting Subtitle */}
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium max-w-lg mx-auto animate-welcome-pop-delayed">
              Welcome to CBC Kenya Resource Hub — Empowering Every Great Teacher
              &amp; Learner Across Grade 1–12.
            </p>

            {/* Smooth Auto-Dismiss Progress Bar */}
            <div className="max-w-xs mx-auto space-y-2.5 pt-2 animate-welcome-pop-delayed">
              <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-teal-300 rounded-full animate-welcome-progress" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200/70">
                Tap anywhere to continue
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
