import type { HTMLAttributes, ReactNode } from 'react';

type Tone = 'neutral' | 'teal' | 'clay';

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  leading?: ReactNode;
  children: ReactNode;
};

const toneClass: Record<Tone, string> = {
  neutral: 'chip',
  teal: 'chip chip-teal',
  clay: 'chip chip-clay',
};

export function Chip({ tone = 'neutral', leading, className, children, ...rest }: ChipProps) {
  const cls = [toneClass[tone], className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {leading}
      {children}
    </span>
  );
}
