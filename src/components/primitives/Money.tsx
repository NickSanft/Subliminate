import type { CSSProperties } from 'react';

type Size = 'xl' | 'lg' | 'md' | 'sm';

type MoneyProps = {
  /** Amount in dollars (or whatever the active currency is). Negative values render with a leading minus. */
  value: number;
  size?: Size;
  /** ISO 4217 currency code, default USD. */
  currency?: string;
  /** Locale for formatting, default 'en-US'. */
  locale?: string;
  /** Whether to show cents. Default true. */
  cents?: boolean;
  /** Optional className appended after the size class. */
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

const sizeClass: Record<Size, string> = {
  xl: 'money-xl tnum',
  lg: 'money-lg tnum',
  md: 'money-md tnum',
  sm: 'money-sm tnum',
};

export function formatMoney(
  value: number,
  { currency = 'USD', locale = 'en-US', cents = true }: { currency?: string; locale?: string; cents?: boolean } = {},
): string {
  const fractionDigits = cents ? 2 : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function Money({
  value,
  size = 'md',
  currency = 'USD',
  locale = 'en-US',
  cents = true,
  className,
  style,
  ariaLabel,
}: MoneyProps) {
  const formatted = formatMoney(value, { currency, locale, cents });
  const cls = [sizeClass[size], className].filter(Boolean).join(' ');
  return (
    <span className={cls} style={style} aria-label={ariaLabel ?? formatted}>
      {formatted}
    </span>
  );
}
