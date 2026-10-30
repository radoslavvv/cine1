import { forwardRef } from 'react';
import { motion, useIsPresent, type HTMLMotionProps } from 'motion/react';
import { useCinemaMotion } from '../../hooks/useCinemaMotion';

type MotionItemProps = HTMLMotionProps<'li'> & {
  delay?: number;
  reveal?: boolean;
};

export const MotionItem = forwardRef<HTMLLIElement, MotionItemProps>(function MotionItem({
  delay = 0,
  reveal = false,
  children,
  ...props
}, ref) {
  const present = useIsPresent();
  const animation = useCinemaMotion(delay, 12);

  return (
    <motion.li
      ref={ref}
      layout="position"
      {...animation}
      {...(reveal ? { animate: undefined, whileInView: animation.animate, viewport: { once: true, amount: 0.08 } } : {})}
      {...props}
      inert={!present || props.inert}
      aria-hidden={!present ? true : props['aria-hidden']}
    >
      {children}
    </motion.li>
  );
});
