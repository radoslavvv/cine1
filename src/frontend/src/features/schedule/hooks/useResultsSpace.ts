import { useLayoutEffect, useRef, useState } from 'react';

export function useResultsSpace() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const width = useRef(0);
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      const nextWidth = content.getBoundingClientRect().width;
      const nextHeight = content.getBoundingClientRect().height;
      // Preserve the largest result footprint across dates; remeasure on resize.
      const resized = Math.abs(nextWidth - width.current) > 1;
      width.current = nextWidth;
      setHeight(previous => resized ? nextHeight : Math.max(previous, nextHeight));
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
  return { contentRef, height };
}
