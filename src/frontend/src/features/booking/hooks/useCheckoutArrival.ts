import { useEffect, type RefObject } from 'react';

export function useCheckoutArrival(heading: RefObject<HTMLHeadingElement | null>) {
  // Checkout mounts after the seat-map exit; focusing when active changes is too early.
  useEffect(() => {
    heading.current?.focus();
  }, [heading]);
}
