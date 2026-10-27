import { useLayoutEffect, useRef, useState } from 'react';

export function useResultsSpace(preserveHeight: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const width = useRef(0);
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => {
      const nextWidth = content.getBoundingClientRect().width;
      const nextHeight = content.getBoundingClientRect().height;
      // Keep loading skeletons stable, but let settled results shrink to fit.
      const resized = Math.abs(nextWidth - width.current) > 1;
      width.current = nextWidth;
      setHeight((previous) =>
        resized || !preserveHeight
          ? nextHeight
          : Math.max(previous, nextHeight),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [preserveHeight]);
  return { contentRef, height };
}
