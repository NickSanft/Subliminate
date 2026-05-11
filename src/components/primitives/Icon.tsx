import type { CSSProperties } from 'react';

type IconProps = { size?: number; style?: CSSProperties; className?: string };

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
};

export const Dot = ({ size = 8, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 8 8" style={style} className={className} aria-hidden>
    <circle cx="4" cy="4" r="4" fill="currentColor" />
  </svg>
);

type ChevronDir = 'up' | 'down' | 'left' | 'right';
const rot: Record<ChevronDir, string> = {
  up: 'rotate(180deg)',
  down: 'rotate(0)',
  left: 'rotate(90deg)',
  right: 'rotate(-90deg)',
};

export const Chevron = ({
  direction = 'down',
  size = 12,
  style,
  className,
}: IconProps & { direction?: ChevronDir }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    style={{ transform: rot[direction], ...style }}
    className={className}
    aria-hidden
  >
    <path d="M3 4.5L6 7.5L9 4.5" {...stroke} />
  </svg>
);

export const ArrowUp = ({ size = 12, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={style} className={className} aria-hidden>
    <path d="M6 9.5V2.5M6 2.5L3 5.5M6 2.5L9 5.5" {...stroke} />
  </svg>
);

export const ArrowDown = ({ size = 12, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={style} className={className} aria-hidden>
    <path d="M6 2.5V9.5M6 9.5L3 6.5M6 9.5L9 6.5" {...stroke} />
  </svg>
);

export const Search = ({ size = 14, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" style={style} className={className} aria-hidden>
    <circle cx="6" cy="6" r="4" {...stroke} strokeWidth={1.3} />
    <path d="M9 9l3 3" {...stroke} strokeWidth={1.3} />
  </svg>
);

export const Lock = ({ size = 14, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" style={style} className={className} aria-hidden>
    <rect x="2.5" y="6" width="9" height="6" rx="1.2" {...stroke} strokeWidth={1.2} />
    <path d="M4.5 6V4.2a2.5 2.5 0 015 0V6" {...stroke} strokeWidth={1.2} />
  </svg>
);

export const External = ({ size = 12, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={style} className={className} aria-hidden>
    <path d="M4.5 2.5h5v5M9.5 2.5L5 7M5 4H3v5h5V7" {...stroke} strokeWidth={1.2} />
  </svg>
);

export const Plus = ({ size = 12, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={style} className={className} aria-hidden>
    <path d="M6 2.5v7M2.5 6h7" {...stroke} />
  </svg>
);

export const X = ({ size = 12, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" style={style} className={className} aria-hidden>
    <path d="M3 3l6 6M9 3l-6 6" {...stroke} />
  </svg>
);

export const Filter = ({ size = 13, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 13 13" style={style} className={className} aria-hidden>
    <path d="M2 3h9M3.5 6.5h6M5 10h3" {...stroke} strokeWidth={1.3} />
  </svg>
);

export const Sort = ({ size = 13, style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 13 13" style={style} className={className} aria-hidden>
    <path
      d="M3 3v8M3 11l-1.5-1.5M3 11l1.5-1.5M10 11V3M10 3l-1.5 1.5M10 3l1.5 1.5"
      {...stroke}
      strokeWidth={1.2}
    />
  </svg>
);

export const Icon = {
  Dot,
  Chevron,
  ArrowUp,
  ArrowDown,
  Search,
  Lock,
  External,
  Plus,
  X,
  Filter,
  Sort,
};
