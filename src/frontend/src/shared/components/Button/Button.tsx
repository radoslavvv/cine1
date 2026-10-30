import { buttonTheme as theme } from './Button.theme';
import { Button as UiButton } from '../ui/button';
import { cn } from '../../lib/utils';
import type { ComponentProps } from 'react';

export function Button({
  className = '',
  type = 'button',
  ...props
}: ComponentProps<typeof UiButton>) {
  return (
    <UiButton className={cn(theme.base, className)} type={type} {...props} />
  );
}
