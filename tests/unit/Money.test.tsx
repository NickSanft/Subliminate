import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Money, formatMoney } from '@/components/primitives/Money';

describe('formatMoney', () => {
  it('formats USD with two decimals by default', () => {
    expect(formatMoney(1284.5)).toBe('$1,284.50');
    expect(formatMoney(0.99)).toBe('$0.99');
  });

  it('drops cents when cents=false', () => {
    expect(formatMoney(1284.5, { cents: false })).toBe('$1,285');
  });

  it('renders negative values with a leading minus', () => {
    expect(formatMoney(-42.99)).toBe('-$42.99');
  });

  it('honors alternate currencies and locales', () => {
    expect(formatMoney(1284.5, { currency: 'EUR', locale: 'de-DE' })).toMatch(/1\.284,50/);
    expect(formatMoney(1284.5, { currency: 'GBP', locale: 'en-GB' })).toBe('£1,284.50');
  });
});

describe('Money component', () => {
  it('applies the correct size class', () => {
    const { container, rerender } = render(<Money value={10} size="xl" />);
    const xl = container.firstChild as HTMLElement;
    expect(xl.classList.contains('money-xl')).toBe(true);
    expect(xl.classList.contains('tnum')).toBe(true);

    rerender(<Money value={10} size="sm" />);
    const sm = container.firstChild as HTMLElement;
    expect(sm.classList.contains('money-sm')).toBe(true);
  });

  it('sets aria-label to the formatted value by default', () => {
    const { container } = render(<Money value={42.99} />);
    expect((container.firstChild as HTMLElement).getAttribute('aria-label')).toBe('$42.99');
  });

  it('respects a custom aria-label', () => {
    const { container } = render(<Money value={42.99} ariaLabel="monthly spend" />);
    expect((container.firstChild as HTMLElement).getAttribute('aria-label')).toBe('monthly spend');
  });
});
