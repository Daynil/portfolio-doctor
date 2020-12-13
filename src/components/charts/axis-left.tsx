import { ScaleLinear } from 'd3';
import React, { useMemo } from 'react';

type Props = {
  domain: [number, number];
  range: [number, number];
  scale: ScaleLinear<number, number>;
  tickFormat?: (number) => string;
};

export function AxisLeft({ domain, range, scale, tickFormat }: Props) {
  const ticks = useMemo(() => {
    const height = range[0] - range[1];
    const numberOfTicksTarget = height / 80;

    return scale
      .ticks(numberOfTicksTarget)
      .map((value) => ({ value, yOffset: scale(value) }));
  }, [domain.join('-'), range.join('-')]);
  return (
    <g>
      <path
        fill="none"
        stroke="currentColor"
        d={['M', -6, range[0], 'h', 6, 'V', range[1], 'h', -6].join(' ')}
      />
      {ticks.map(({ value, yOffset }) => (
        <g
          key={value}
          className="text-gray-600 tracking-wide text-sm"
          transform={`translate(0, ${yOffset})`}
        >
          <line x2="-6" stroke="currentColor" />
          <text
            key={value}
            fill="currentColor"
            transform="translate(-10, 5)"
            style={{
              textAnchor: 'end'
            }}
          >
            {!tickFormat ? value : tickFormat(value)}
          </text>
        </g>
      ))}
    </g>
  );
}
