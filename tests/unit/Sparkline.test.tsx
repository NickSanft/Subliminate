import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from '@/components/primitives/Sparkline';

describe('Sparkline', () => {
  it('renders an empty svg when given fewer than 2 points', () => {
    const { container } = render(<Sparkline data={[5]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('polyline')).toBeNull();
    expect(svg?.querySelector('polygon')).toBeNull();
  });

  it('renders a polyline with the correct number of points', () => {
    const data = [1, 2, 3, 4, 5];
    const { container } = render(<Sparkline data={data} width={80} height={20} />);
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeNull();
    const pts = polyline!.getAttribute('points')!.trim().split(/\s+/);
    expect(pts).toHaveLength(data.length);
  });

  it('renders a filled polygon when fill=true', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} fill />);
    expect(container.querySelector('polygon')).not.toBeNull();
  });

  it('maps the maximum value to the top of the canvas (with 2px padding)', () => {
    const { container } = render(<Sparkline data={[0, 10]} width={100} height={20} />);
    const polyline = container.querySelector('polyline')!;
    const pts = polyline.getAttribute('points')!.trim().split(/\s+/);
    // Second point is at y=2 (top padding), first is at y=18 (bottom — height - 2)
    expect(pts[1]).toBe('100.0,2.0');
    expect(pts[0]).toBe('0.0,18.0');
  });

  it('handles a flat series without dividing by zero', () => {
    const { container } = render(<Sparkline data={[5, 5, 5]} />);
    const polyline = container.querySelector('polyline')!;
    expect(polyline.getAttribute('points')).not.toContain('NaN');
  });
});
