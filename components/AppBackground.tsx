'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const ElasticMesh = dynamic(() => import('@/components/ElasticMesh'), {
  ssr: false,
});

export function AppBackground() {
  const [cursor, setCursor] = useState({ x: -400, y: -400, active: false });
  const [scrollY, setScrollY] = useState(0);
  const mouseRef = useRef({ x: -400, y: -400 });
  const posRef = useRef({ x: -400, y: -400 });
  const scrollRef = useRef(0);
  const smoothScrollRef = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!cursor.active) {
        setCursor((prev) => ({ ...prev, active: true }));
      }
    };

    const handlePointerLeave = () => {
      setCursor((prev) => ({ ...prev, active: false }));
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    scrollRef.current = window.scrollY;
    smoothScrollRef.current = window.scrollY;
    setScrollY(window.scrollY);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const animate = () => {
      // Smooth lerp for liquid-smooth cursor follower
      posRef.current.x += (mouseRef.current.x - posRef.current.x) * 0.14;
      posRef.current.y += (mouseRef.current.y - posRef.current.y) * 0.14;

      setCursor({
        x: Math.round(posRef.current.x),
        y: Math.round(posRef.current.y),
        active: true,
      });

      // Smooth lerp for natural scrolling parallax
      smoothScrollRef.current += (scrollRef.current - smoothScrollRef.current) * 0.1;
      setScrollY(Math.round(smoothScrollRef.current));

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [cursor.active]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full overflow-hidden bg-[#070C1B]"
    >
      {/* Ambient aura gradients distributed throughout viewport */}
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        {/* Top hero ambient aura */}
        <div className="pointer-events-none absolute left-1/2 -top-24 h-[620px] w-[960px] -translate-x-1/2 rounded-full bg-azure-600/22 blur-[150px] animate-glow-pulse" />

        {/* Mid-section ambient aura (Demo / Scripts / Stats) */}
        <div className="pointer-events-none absolute left-1/4 top-[35%] h-[580px] w-[820px] -translate-x-1/2 rounded-full bg-azure-500/18 blur-[160px]" />

        {/* Lower-section ambient aura (FAQ & content depth) */}
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-[680px] w-[920px] rounded-full bg-azure-600/22 blur-[160px]" />

        {/* Lateral edge ambient lights to prevent dark borders on wide viewports */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-azure-600/12 via-azure-500/6 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-azure-600/12 via-azure-500/6 to-transparent blur-3xl" />
      </div>

      {/* Mouse Cursor Follower Spotlight - smoothly tracks cursor across entire screen */}
      <div
        className="pointer-events-none absolute h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azure-500/18 blur-[100px] transition-opacity duration-500"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          opacity: cursor.active ? 1 : 0,
          willChange: 'left, top',
        }}
      />
      {/* Secondary tight cursor core glow */}
      <div
        className="pointer-events-none absolute h-[140px] w-[140px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-azure-400/20 blur-[50px] transition-opacity duration-300"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          opacity: cursor.active ? 0.8 : 0,
          willChange: 'left, top',
        }}
      />

      {/* ElasticMesh interactive reactive layer covering full viewport across all sections */}
      <div className="absolute inset-0 h-full w-full opacity-45 mix-blend-screen">
        <ElasticMesh
          color1="#070C1B"
          color2="#0b132b"
          highlight="#82a9ff"
          gridColor="#5487ff"
          showGrid={true}
          gridDensity={24}
          gridOpacity={0.24}
          borderRadius={0}
          fit={1.25}
          tilt={10}
          shading={0.4}
          stiffness={0.06}
          damping={0.17}
          wobble={6}
          pull={0.52}
          grabRadius={0.75}
          interaction="hover"
          trackGlobalPointer={true}
        />
      </div>

      {/* Full-bleed technical cyber grid overlay with natural vertical scroll motion */}
      <div
        className="absolute inset-0 h-full w-full bg-grid opacity-35"
        style={{
          backgroundPositionY: `${-(scrollY * 0.35)}px`,
          willChange: 'background-position',
        }}
      />
    </div>
  );
}
