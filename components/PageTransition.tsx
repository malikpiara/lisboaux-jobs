'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { useNavTransition } from '@/components/NavigationTransition';

// Custom ease-out-quart — matches JobList's transition curve
const EASE_OUT = 'cubic-bezier(0.165, 0.84, 0.44, 1)';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content to provide smooth enter/exit transitions.
 *
 * Exit: When isNavigating is true (user clicked a TransitionLink
 * or the city picker triggered navigate()), content blurs + fades.
 *
 * Enter: On mount, content starts slightly faded and animates in.
 * This prevents the "snap in" effect when a new page resolves.
 *
 * Usage — wrap the page content inside each page component:
 *
 *   <PageTransition>
 *     <header>...</header>
 *     <div>context bar</div>
 *     <main>
 *       <JobList ... />
 *     </main>
 *   </PageTransition>
 */
export function PageTransition({ children }: PageTransitionProps) {
  const { isNavigating } = useNavTransition();

  // ─── ENTRANCE ANIMATION ───────────────────────────────────
  // On mount, start hidden and animate in after one frame.
  // This ensures the browser registers the initial state
  // before transitioning to the visible state.
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // requestAnimationFrame ensures the browser has painted
    // the initial (hidden) state before we flip to visible.
    // Without this, the browser may batch both states into
    // one paint and skip the transition entirely.
    const raf = requestAnimationFrame(() => {
      setHasMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // ─── REDUCED MOTION ───────────────────────────────────────
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ─── TRANSITION LOGIC ─────────────────────────────────────
  // Three states:
  //   1. Just mounted, hasn't painted yet → hidden (entrance start)
  //   2. Mounted + painted → visible (entrance complete)
  //   3. isNavigating → hidden (exit)
  const isVisible = hasMounted && !isNavigating;

  const style = reducedMotion
    ? {}
    : {
        opacity: isVisible ? 1 : 0.5,
        filter: isVisible ? 'blur(0px)' : 'blur(2px)',
        // Exit is faster than entrance (150ms vs 250ms)
        // per the animation guideline: exits ~20% faster.
        transition: isVisible
          ? `opacity 250ms ${EASE_OUT}, filter 250ms ${EASE_OUT}`
          : `opacity 150ms ${EASE_OUT}, filter 150ms ${EASE_OUT}`,
      };

  return (
    <div className='w-full' style={style}>
      {children}
    </div>
  );
}
