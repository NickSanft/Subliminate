import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  leading?: ReactNode;
  trailing?: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
};

export function Button({
  variant = 'secondary',
  leading,
  trailing,
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  const cls = [variantClass[variant], className].filter(Boolean).join(' ');
  return (
    <button type={type ?? 'button'} className={cls} {...rest}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}
