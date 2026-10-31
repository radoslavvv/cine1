import { motion, useIsPresent, type HTMLMotionProps } from 'motion/react';
import { useCinemaMotion } from '../../hooks/useCinemaMotion';

type MotionSurfaceProps = HTMLMotionProps<'div'> & {
  delay?: number;
  distance?: number;
  reveal?: boolean;
};

// Presence also owns accessibility: disappearing content is immediately inert.
export function MotionSurface({
  delay = 0,
  distance = 16,
  reveal = false,
  children,
  ...props
}: MotionSurfaceProps) {
  const present = useIsPresent();
  const animation = useCinemaMotion(delay, distance);

  return (
    <motion.div
      {...animation}
      {...(reveal
        ? {
            animate: undefined,
            whileInView: animation.animate,
            viewport: { once: true, amount: 0.08 },
          }
        : {})}
      {...props}
      inert={!present || props.inert}
      aria-hidden={!present ? true : props['aria-hidden']}
    >
      {children}
    </motion.div>
  );
}
