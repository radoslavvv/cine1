import { statusMessageTheme as theme } from './StatusMessage.theme';
import type { ReactNode } from 'react';

export function StatusMessage({
  title,
  children,
  isError = false,
}: {
  title: string;
  children: ReactNode;
  isError?: boolean;
}) {
  return (
    <div className={theme.panel} role={isError ? 'alert' : 'status'}>
      <span className={theme.icon} aria-hidden="true">
        {isError ? '◌' : '✳'}
      </span>
      <div className={theme.content}>
        <h3 className={theme.title}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
