import { useReducedMotion } from 'motion/react';

const ease = [0.22, 1, 0.36, 1] as const;

export function useCinemaMotion(delay = 0, distance = 16) {
  const reduced = useReducedMotion();

  return {
    initial: reduced ? false as const : { opacity: 0, y: distance },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.28, delay: reduced ? 0 : Math.min(delay, 0.18), ease },
    },
    exit: {
      opacity: reduced ? 1 : 0,
      y: reduced ? 0 : -Math.min(distance, 8),
      transition: { duration: reduced ? 0 : 0.12, ease },
    },
    transition: { duration: reduced ? 0 : 0.28, ease },
  };
}
