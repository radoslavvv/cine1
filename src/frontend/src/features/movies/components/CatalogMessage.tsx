import type { ReactNode } from 'react';

interface CatalogMessageProps {
  title: string;
  children: ReactNode;
  isError?: boolean;
}

export function CatalogMessage({ title, children, isError = false }: CatalogMessageProps) {
  return (
    <div className="flex gap-4 rounded-xl border border-edge bg-surface p-6 sm:gap-6 sm:p-9" role={isError ? 'alert' : 'status'}>
      <span className="font-label text-3xl text-amber" aria-hidden="true">{isError ? '◌' : '✳'}</span>
      <div className="min-w-0 text-sm leading-relaxed text-muted [&_p]:mb-4 [&_p:last-child]:mb-0">
        <h3 className="mb-2 font-display text-2xl text-ivory">{title}</h3>
        {children}
      </div>
    </div>
  );
}
