import { ScaleLinear } from 'd3';
import React, { useMemo } from 'react';

type Props = {
  domain: [number, number];
  range: [number, number];
  scale: ScaleLinear<number, number>;
  height: number;
};

// https://wattenberger.com/blog/react-and-d3
export function AxisBottom({ domain, range, scale, height }: Props) {
  const ticks = useMemo(() => {
    const width = range[1] - range[0];
    const numberOfTicksTarget = width / 80;

    return scale
      .ticks(numberOfTicksTarget)
      .map((value) => ({ value, xOffset: scale(value) }));
  }, [domain.join('-'), range.join('-')]);
  return (
    <g transform={`translate(0,${height})`}>
      <path
        fill="none"
        stroke="currentColor"
        d={['M', range[0], 6, 'v', -6, 'H', range[1], 'v', 6].join(' ')}
      />
      {ticks.map(({ value, xOffset }) => (
        <g
          key={value}
          className="text-gray-600 tracking-wide text-sm"
          transform={`translate(${xOffset}, 0)`}
        >
          <line y2="6" stroke="currentColor" />
          <text
            key={value}
            fill="currentColor"
            style={{
              textAnchor: 'middle',
              transform: 'translateY(20px)'
            }}
          >
            {value}
          </text>
        </g>
      ))}
    </g>
  );
}
