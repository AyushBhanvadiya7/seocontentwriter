"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Interactive helpers for the marketing pages.
// No libraries, no heavy 3D — tiny scroll/mouse listeners + GPU-friendly CSS.
// Mobile-safe: touch devices see the clean static version.
// Motion-sensitive users: keyframe animations switch off via CSS.

// Fades + unblurs content the first time it scrolls into view.
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Very old browser: reveal on the next frame instead.
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-10 opacity-0 blur-sm"
      }`}
    >
      {children}
    </div>
  );
}

// A thin progress line pinned to the top while scrolling the page.
export function ScrollProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      const page = document.documentElement;
      const max = page.scrollHeight - page.clientHeight;
      setWidth(max > 0 ? (page.scrollTop / max) * 100 : 0);
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    const start = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(start);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1">
      <div
        style={{ width: `${width}%` }}
        className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400"
      />
    </div>
  );
}

// Moves its child slower/faster than the scroll (depth effect).
// Direct DOM writes (no re-renders), so scrolling stays smooth.
export function Parallax({
  children,
  speed = 0.12,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      const el = ref.current;
      if (el) el.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0)`;
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    const start = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(start);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

// Counts 0 → value the first time it scrolls into view.
export function Counter({
  value,
  duration = 1400,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setN(value));
      return () => cancelAnimationFrame(frame);
    }
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();
          const t0 = performance.now();
          function tick(t: number) {
            const p = Math.min((t - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(eased * value));
            if (p < 1) raf = requestAnimationFrame(tick);
          }
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return <span ref={ref}>{n}</span>;
}

// A button that leans gently toward the cursor (magnetic feel).
export function Magnetic({
  children,
  className = "",
  strength = 6,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setT({
      x: ((e.clientX - box.left) / box.width - 0.5) * 2 * strength,
      y: ((e.clientY - box.top) / box.height - 0.5) * 2 * strength,
    });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      style={{ transform: `translate(${t.x}px, ${t.y}px)` }}
      className={`inline-block transition-transform duration-150 ease-out ${className}`}
    >
      {children}
    </div>
  );
}

// Smooth accordion (animates open/close, unlike plain details/summary).
export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <div
          key={f.q}
          className={`rounded-xl border bg-white shadow-sm transition-colors ${
            open === i ? "border-blue-300" : "border-slate-200"
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium text-slate-900"
          >
            {f.q}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-blue-600 transition-transform duration-300 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`grid transition-all duration-300 ease-out ${
              open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// A soft blue light that follows the mouse inside its box.
export function MouseGlow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 40 });
  const [active, setActive] = useState(false);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setPos({
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    });
  }

  const glowStyle: CSSProperties = {
    background: `radial-gradient(480px circle at ${pos.x}% ${pos.y}%, rgba(59,130,246,0.22), transparent 70%)`,
    opacity: active ? 1 : 0.55,
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden
        style={glowStyle}
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
      />
      {children}
    </div>
  );
}

// A card that tilts slightly toward the mouse (playful 3D feel).
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const px = (e.clientX - box.left) / box.width - 0.5;
    const py = (e.clientY - box.top) / box.height - 0.5;
    setTilt({ rx: -py * 7, ry: px * 9 });
  }

  const style: CSSProperties = {
    transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      style={style}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}