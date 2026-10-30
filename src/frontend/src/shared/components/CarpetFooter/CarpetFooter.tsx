import { motion } from 'motion/react';
import { MotionSurface } from '../MotionSurface/MotionSurface';
import { useCinemaMotion } from '../../hooks/useCinemaMotion';
import { Link } from 'react-router-dom';

export function CarpetFooter({ topId }: { topId: string }) {
  const animation = useCinemaMotion();
  return (
    <motion.footer layout="position" transition={animation.transition} className="relative z-10 w-full shrink-0 border-t border-amber/15 bg-carpet before:pointer-events-none before:absolute before:inset-0 before:bg-lobby/40">
      <MotionSurface reveal distance={8} className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-5 px-5 text-ivory sm:h-20 sm:px-10">
        <span className="font-display text-2xl font-semibold tracking-[-0.055em]">
          cinema<span className="italic text-amber">R</span>
        </span>
        {import.meta.env.DEV && <Link to="/admin" className="text-xs text-ivory/80 hover:text-amber-light">Admin</Link>}
        <a
          className="inline-flex min-h-11 items-center gap-4 text-xs text-ivory/80 transition-colors hover:text-amber-light"
          href={`#${topId}`}
        >
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </MotionSurface>
    </motion.footer>
  );
}
