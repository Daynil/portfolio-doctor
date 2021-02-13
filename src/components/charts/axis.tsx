import { ScaleLinear } from 'd3';
import React, { useMemo } from 'react';
import { Dimensions } from '../../utilities/hooks';
import { useChartContext } from './chart';

type AxisProps = {
  orientation: 'left' | 'bottom';
  scale: ScaleLinear<number, number>;
  label?: string;
  formatTick?: (d: number) => string;
};

type OrientationProps = Omit<AxisProps, 'orientation'> & {
  dimensions: Dimensions;
};

export function Axis({ orientation, ...props }: AxisProps) {
  const dimensions = useChartContext();
  return orientation === 'bottom' ? (
    <AxisBottom dimensions={dimensions} {...props} />
  ) : (
    <AxisLeft dimensions={dimensions} {...props} />
  );
}

function AxisBottom({
  scale,
  dimensions,
  label,
  formatTick,
  ...props
}: OrientationProps) {
  const domain = scale.domain();
  const range = scale.range();
  const ticks = useMemo(() => {
    const width = range[1] - range[0];
    const numberOfTicksTarget = width / 80;

    return scale
      .ticks(numberOfTicksTarget)
      .map((value) => ({ value, xOffset: scale(value) }));
  }, [domain.join('-'), range.join('-')]);
  return (
    <g transform={`translate(0,${dimensions.boundedHeight})`} {...props}>
      {label && (
        <text
          x={dimensions.boundedWidth / 2}
          y={dimensions.marginBottom - 15}
          fill="currentColor"
          style={{
            textAnchor: 'middle',
            fontSize: '1rem'
          }}
        >
          {label}
        </text>
      )}
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
            {!formatTick ? value : formatTick(value)}
          </text>
        </g>
      ))}
    </g>
  );
}

function AxisLeft({
  scale,
  dimensions,
  label,
  formatTick,
  ...props
}: OrientationProps) {
  const domain = scale.domain();
  const range = scale.range();
  const ticks = useMemo(() => {
    const height = range[0] - range[1];
    const numberOfTicksTarget = height / 80;

    return scale
      .ticks(numberOfTicksTarget)
      .map((value) => ({ value, yOffset: scale(value) }));
  }, [domain.join('-'), range.join('-')]);
  return (
    <g {...props}>
      {label && (
        <text
          x={-dimensions.boundedHeight / 2}
          y={-dimensions.marginLeft + 15}
          fill="currentColor"
          style={{
            transform: 'rotate(-90deg)',
            textAnchor: 'middle',
            fontSize: '1rem'
          }}
        >
          {label}
        </text>
      )}
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
            {!formatTick ? value : formatTick(value)}
          </text>
        </g>
      ))}
    </g>
  );
}
