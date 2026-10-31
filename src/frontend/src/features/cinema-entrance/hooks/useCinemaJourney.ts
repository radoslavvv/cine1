import { useLayoutEffect, useRef } from 'react';
import { getJourneyGeometry } from '../journeyGeometry';

const clamp = (value: number) => {
  return Math.min(1, Math.max(0, value));
};

export function useCinemaJourney(onComplete: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const journey = journeyRef.current;
    const stage = stageRef.current;

    if (!root || !journey || !stage) {
      return;
    }

    const controls = root.querySelectorAll<HTMLElement>(
      '[data-entrance-controls]',
    );
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previousTime = 0;
    let progress = 0;
    let target = 0;
    let completed = false;

    function update(time: number) {
      frame = 0;

      if (completed) {
        return;
      }

      const delta = previousTime ? Math.min(time - previousTime, 64) : 16;

      previousTime = time;
      progress += (target - progress) * (1 - Math.exp(-delta / 65));

      if (Math.abs(target - progress) < 0.0005) {
        progress = target;
      }

      const camera = clamp(progress / 0.84);

      root!.style.setProperty(
        '--travel',
        String(camera * camera * (3 - 2 * camera)),
      );
      root!.style.setProperty(
        '--entrance-hint',
        String(clamp(1 - progress * 5)),
      );
      controls.forEach((control) => {
        control.inert = progress >= 0.2;
      });

      if (progress === 1) {
        completed = true;
        onComplete();
      } else if (progress !== target) {
        frame = requestAnimationFrame(update);
      } else {
        previousTime = 0;
      }
    }

    function measure() {
      if (completed) {
        return;
      }

      const distance = journey!.offsetHeight - stage!.offsetHeight;
      const top = journey!.getBoundingClientRect().top;

      // Layout and scroll offsets can round differently at the bottom.
      target = -top >= distance - 1 ? 1 : clamp(-top / Math.max(1, distance));

      if (reducedMotion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        progress = 0;
        previousTime = 0;
        root!.style.setProperty('--travel', '0');
        root!.style.setProperty('--entrance-hint', '1');
        controls.forEach((control) => {
          control.inert = false;
        });

        if (target === 1) {
          completed = true;
          onComplete();
        }

        return;
      }

      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    function resize() {
      const geometry = getJourneyGeometry(
        stage!.clientWidth,
        stage!.clientHeight,
      );

      root!.style.setProperty('--image-width', `${geometry.imageWidth}px`);
      root!.style.setProperty('--image-height', `${geometry.imageHeight}px`);
      root!.style.setProperty('--image-left', `${geometry.left}px`);
      root!.style.setProperty('--image-top', `${geometry.top}px`);
      root!.style.setProperty('--camera-origin-x', `${geometry.originX}px`);
      root!.style.setProperty('--camera-origin-y', `${geometry.originY}px`);
      root!.style.setProperty('--camera-scale', String(geometry.scale));
      root!.style.setProperty('--camera-shift-x', `${geometry.shiftX}px`);
      root!.style.setProperty('--camera-shift-y', `${geometry.shiftY}px`);
      measure();
    }

    const observer = new ResizeObserver(resize);

    observer.observe(journey);
    observer.observe(stage);
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', resize);
    addEventListener('pageshow', resize);
    reducedMotion.addEventListener('change', resize);
    resize();

    return () => {
      completed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('scroll', measure);
      removeEventListener('resize', resize);
      removeEventListener('pageshow', resize);
      reducedMotion.removeEventListener('change', resize);
    };
  }, [onComplete]);

  return { rootRef, journeyRef, stageRef };
}
