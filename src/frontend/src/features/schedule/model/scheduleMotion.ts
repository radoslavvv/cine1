export function createScheduleMotionSession(now = () => performance.now()) {
  let openedAt: number | null = null;
  const starts = new Map<string, number>();
  const listeners = new Set<() => void>();

  return {
    start() {
      if (openedAt !== null) return;
      openedAt = now();
      listeners.forEach((listener) => listener());
    },
    reset() {
      openedAt = null;
      starts.clear();
      listeners.forEach((listener) => listener());
    },
    startFor(key: string, delay: number) {
      if (openedAt === null) return null;
      if (!starts.has(key)) starts.set(key, Math.max(openedAt + delay, now()));
      return starts.get(key)!;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type ScheduleMotionSession = ReturnType<
  typeof createScheduleMotionSession
>;
