import { useLayoutEffect, type ReactNode } from 'react';
import { MotionSurface } from '../../../shared/components/MotionSurface/MotionSurface';

export function RouteTransition({ pathname, onEnter, children }: {
  pathname: string;
  onEnter: (pathname: string) => void;
  children: ReactNode;
}) {
  useLayoutEffect(() => onEnter(pathname), [pathname, onEnter]);

  return <MotionSurface distance={0}>{children}</MotionSurface>;
}
