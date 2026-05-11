import type { CSSProperties } from 'react';

type SealProps = {
  size?: number;
  title?: string;
  style?: CSSProperties;
};

export function Seal({ size = 16, title = 'Verifiable', style }: SealProps) {
  return (
    <span
      className="seal"
      style={{ width: size, height: size, ...style }}
      title={title}
      role="img"
      aria-label={title}
    >
      <svg
        width={Math.max(6, size - 6)}
        height={Math.max(6, size - 6)}
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 5l2 2 4-4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
