'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const ElasticMesh = dynamic(() => import('@/components/ElasticMesh'), {
  ssr: false,
});

export function AppBackground() {
  const [shouldRenderMesh, setShouldRenderMesh] = useState(false);
  const outerGlowRef = useRef<HTMLDivElement>(null);
  const innerGlowRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for mobile device, coarse pointer, or prefers-reduced-motion
    const isMobileQuery = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const isMobileDevice = isMobileQuery.matches || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    const prefersReducedMotion = reducedMotionQuery.matches;

    // Only render high-overhead WebGL ElasticMesh on desktop with capable hardware & no reduced motion
    if (!isMobileDevice && !prefersReducedMotion) {
      // Delay mounting WebGL until after initial paint so FCP & LCP remain instant
      const timer = setTimeout(() => {
        setShouldRenderMesh(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Only bind cursor follower on devices with fine pointer (mouse)
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) return;

    let targetX = -400;
    let targetY = -400;
    let currentX = -400;
    let currentY = -400;
    let isActive = false;
    let isHidden = false;
    let rafId: number | null = null;
    let isLoopRunning = false;

    const updateDOM = () => {
      if (outerGlowRef.current) {
        outerGlowRef.current.style.transform = `translate3d(${Math.round(currentX)}px, ${Math.round(currentY)}px, 0) translate(-50%, -50%)`;
        outerGlowRef.current.style.opacity = isActive ? '1' : '0';
      }
      if (innerGlowRef.current) {
        innerGlowRef.current.style.transform = `translate3d(${Math.round(currentX)}px, ${Math.round(currentY)}px, 0) translate(-50%, -50%)`;
        innerGlowRef.current.style.opacity = isActive ? '0.85' : '0';
      }
    };

    const loop = () => {
      if (isHidden) {
        isLoopRunning = false;
        return;
      }

      const dx = targetX - currentX;
      const dy = targetY - currentY;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        currentX += dx * 0.15;
        currentY += dy * 0.15;
        updateDOM();
        rafId = requestAnimationFrame(loop);
      } else {
        currentX = targetX;
        currentY = targetY;
        updateDOM();
        isLoopRunning = false;
      }
    };

    const startLoop = () => {
      if (!isLoopRunning && !isHidden) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(loop);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isActive) {
        isActive = true;
      }
      startLoop();
    };

    const handlePointerLeave = () => {
      isActive = false;
      if (outerGlowRef.current) outerGlowRef.current.style.opacity = '0';
      if (innerGlowRef.current) innerGlowRef.current.style.opacity = '0';
    };

    const handleScroll = () => {
      if (gridRef.current) {
        gridRef.current.style.backgroundPositionY = `${-(window.scrollY * 0.25)}px`;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        isHidden = true;
        if (rafId) cancelAnimationFrame(rafId);
        isLoopRunning = false;
      } else {
        isHidden = false;
        if (isActive) startLoop();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

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

      {/* Mouse Cursor Follower Spotlight (Desktop only via direct DOM transform, zero React rerenders) */}
      <div
        ref={outerGlowRef}
        className="pointer-events-none absolute left-0 top-0 h-[380px] w-[380px] rounded-full bg-azure-500/18 blur-[100px] opacity-0 transition-opacity duration-300 will-change-transform"
      />
      <div
        ref={innerGlowRef}
        className="pointer-events-none absolute left-0 top-0 h-[140px] w-[140px] rounded-full bg-azure-400/20 blur-[50px] opacity-0 transition-opacity duration-200 will-change-transform"
      />

      {/* ElasticMesh interactive reactive layer: Desktop only, omitted on mobile */}
      {shouldRenderMesh ? (
        <div className="absolute inset-0 h-full w-full opacity-45 mix-blend-screen transition-opacity duration-700">
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
      ) : null}

      {/* Full-bleed technical cyber grid overlay with natural vertical scroll motion (hardware accelerated) */}
      <div
        ref={gridRef}
        className="absolute inset-0 h-full w-full bg-grid opacity-35 will-change-[background-position]"
      />
    </div>
  );
}
