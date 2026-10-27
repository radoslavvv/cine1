import { buttonTheme as theme } from './Button.theme';
import type { ButtonHTMLAttributes } from 'react';

export function Button({
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${theme.base} ${className}`} type={type} {...props} />
  );
}
