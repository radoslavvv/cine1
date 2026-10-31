import { useLayoutEffect, type ReactNode } from 'react';

export function RouteTransition({
  pathname,
  onEnter,
  children,
}: {
  pathname: string;
  onEnter: (pathname: string) => void;
  children: ReactNode;
}) {
  useLayoutEffect(() => onEnter(pathname), [pathname, onEnter]);

  return <div>{children}</div>;
}
