import type { ReactNode } from 'react';

export function LoadingLayout({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-busy="true" aria-label={label}>
        <div aria-hidden="true">{children}</div>
      </div>
    </>
  );
}
