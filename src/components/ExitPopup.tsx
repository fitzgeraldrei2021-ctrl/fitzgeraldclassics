"use client";

import { useEffect, useRef, useState } from "react";

const SIGNUP_URL = "https://buttondown.com/fitzgeraldclassics";
const STORAGE_KEY = "fc-exit-popup-last-shown";
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // don't nag: at most once a month per visitor
const MIN_TIME_ON_SITE_MS = 8000; // never fire in the first few seconds

export default function ExitPopup() {
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    // Screenshot/preview aid: ?preview-popup shows the popup right away.
    if (new URLSearchParams(window.location.search).has("preview-popup")) {
      const timer = window.setTimeout(() => {
        shownRef.current = true;
        setVisible(true);
      }, 50);
      return () => window.clearTimeout(timer);
    }
    let lastShown = 0;
    try {
      lastShown = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    } catch {
      lastShown = 0;
    }
    if (Date.now() - lastShown < COOLDOWN_MS) return;

    const startedAt = Date.now();
    let maxScrollY = window.scrollY;
    let lastScrollY = window.scrollY;
    let lastScrollAt = Date.now();

    const show = () => {
      if (shownRef.current) return;
      if (Date.now() - startedAt < MIN_TIME_ON_SITE_MS) return;
      shownRef.current = true;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // storage unavailable; the popup still shows this once this visit
      }
      setVisible(true);
    };

    // Desktop exit intent: the pointer leaves the top of the window,
    // heading for the tab bar, back button or address bar.
    const onMouseLeave = (event: MouseEvent) => {
      if (!event.relatedTarget && event.clientY <= 8) show();
    };

    // Mobile stand-in for exit intent: after reading well down the page,
    // a fast scroll back toward the top usually means "I'm done here".
    const onScroll = () => {
      const now = Date.now();
      const y = window.scrollY;
      if (y > maxScrollY) maxScrollY = y;
      const rising = lastScrollY - y;
      const elapsed = now - lastScrollAt;
      if (maxScrollY > 600 && elapsed > 0 && rising / elapsed > 2.5 && y < 300) {
        show();
      }
      lastScrollY = y;
      lastScrollAt = now;
    };

    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => setVisible(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-popup-title"
        className="relative w-full max-w-[440px] border border-gold bg-surface p-8 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close"
          className="absolute right-3 top-3 text-muted hover:text-cream"
        >
          ✕
        </button>
        <p id="exit-popup-title" className="font-serif text-[26px] font-bold leading-tight text-cream">
          Thanks for visiting!
        </p>
        <p className="mt-4 text-[16px] leading-[1.55] text-cream">
          I look forward to seeing you again. If you&apos;re interested in our newsletter — the Garage
          Letter, one email a month from the shop with the new guides, the parts that just landed, and
          what broke and what fixed it — click below and I&apos;ll get you signed up.
        </p>
        <a
          href={SIGNUP_URL}
          className="mt-6 inline-block bg-gold px-6 py-3 font-serif text-[17px] font-bold text-ink"
          onClick={() => setVisible(false)}
        >
          Join the Garage Letter
        </a>
        <div className="mt-7 border-t border-line pt-5">
          <p className="text-[15px] leading-[1.5] text-cream">
            Rather follow along day to day? Come join us where the builds happen:
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61594520112307"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gold px-4 py-2 font-serif text-[15px] font-bold text-gold hover:bg-gold hover:text-ink"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com/fitzgeraldclassics"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gold px-4 py-2 font-serif text-[15px] font-bold text-gold hover:bg-gold hover:text-ink"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@fitzgeraldclassics"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gold px-4 py-2 font-serif text-[15px] font-bold text-gold hover:bg-gold hover:text-ink"
            >
              TikTok
            </a>
          </div>
        </div>
        <p className="mt-4">
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-[14px] text-muted underline hover:text-cream"
          >
            No thanks, maybe another time
          </button>
        </p>
      </div>
    </div>
  );
}
