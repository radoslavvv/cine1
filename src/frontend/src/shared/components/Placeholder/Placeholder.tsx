export function Placeholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-sm bg-ivory/[0.06] motion-safe:animate-pulse ${className}`}
    />
  );
}
