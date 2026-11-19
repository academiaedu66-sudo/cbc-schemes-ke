"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Heart, Music2, Sparkles } from "lucide-react";
import {
  COMPULSORY_WELCOME_SONG_DONE_KEY,
  isSearchCrawlerBot,
} from "./LuxuryWelcomeSong";

export default function WelcomeAnimation() {
  const [showSplash, setShowSplash] = useState(false);
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

  const triggerSongReplay = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cbc-replay-welcome-song"));
    }
  };

  // For returning visitors who already completed the compulsory 1-minute welcome song,
  // show the brief 3.6s welcome splash. First-time visitors immediately see the full-screen
  // 1-Minute 5-Star Concierge Compulsory Welcome Song Gate instead!
  useEffect(() => {
    if (typeof window === "undefined" || isSearchCrawlerBot()) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const forcedSong = params.get("autoplay_song") === "1";
      const completedCompulsorySong = localStorage.getItem(
        COMPULSORY_WELCOME_SONG_DONE_KEY
      );
      if (completedCompulsorySong && !forcedSong) {
        setShowSplash(true);
      }
    } catch {}
  }, []);

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
        <div className="w-full px-3 sm:px-6 py-2 flex items-center justify-between gap-2.5">
          {/* Far-Left Mini Crest & Wordmark */}
          <div className="inline-flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cbcmaterials-logo.jpg"
              alt="CBCMATERIALS.SHOP Logo"
              className="w-6 h-6 rounded-md bg-white border border-amber-300 object-cover shrink-0"
            />
            <span className="hidden sm:inline-flex text-xs font-black uppercase tracking-wider items-center">
              <span className="text-amber-300">CBC</span>
              <span className="text-emerald-300">MATERIALS</span>
              <span className="text-rose-400">.SHOP</span>
            </span>
          </div>

          {/* Center Welcome Statement */}
          <div className="flex items-center justify-center gap-2 text-center">
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

          {/* Right Song Replay Button */}
          <button
            type="button"
            onClick={triggerSongReplay}
            title="Play 1-Minute 5-Star Concierge Welcome Song"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/40 text-[10px] font-extrabold uppercase tracking-wider text-amber-200 transition cursor-pointer shrink-0"
          >
            <Music2 className="w-3 h-3 text-amber-300" />
            <span>1-Min Song</span>
          </button>
        </div>
      </div>

      {/* Brief Entry Welcome Splash (For Returning Visitors Who Already Listened to the 1-Min Song) */}
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
                Warm Welcome Back
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
