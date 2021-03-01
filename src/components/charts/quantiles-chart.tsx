import { leastIndex, line, max, maxIndex, scaleLinear } from 'd3';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CycleYearQuantile,
  QuantileStats
} from '../../data/calc/portfolio-calc';
import { numToCurrencyShort } from '../../utilities/format';
import { useChartDimensions } from '../../utilities/hooks';
import { clamp } from '../../utilities/math';
import { Point } from '../historic-portfolio-details';
import { Axis } from './axis';
import { Chart } from './chart';
import { QuantilesTooltip } from './quantiles-tooltip';

export type D3Selection<T extends d3.BaseType> = d3.Selection<
  T,
  unknown,
  null,
  undefined
>;

export const quantileColors = {
  green: {
    normal: '#48BB78',
    dark: '#38A169'
  },
  blue: {
    normal: '#06B6D4',
    dark: '#0E7490'
  },
  purple: {
    normal: '#A855F7',
    dark: '#7E22CE'
  },
  yellow: {
    normal: '#FFD600',
    dark: '#FFD600'
  },
  red: {
    normal: '#F56565',
    dark: '#E53E3E'
  }
};

const tooltipWidth = 325;

type Props = {
  /** An array of points is a line, 2d array for multiple lines */
  dataSeries: CycleYearQuantile[][];
  allLineMeta: QuantileStats[];
  /** Chart's aspect ratio */
  aspectRatio: number;
  selectedPoint: Point;
  handleSetSelectedPoint: (point: Point) => void;
  pointFixed: boolean;
  handleSetPointFixed: (fixed: boolean) => void;
};

export function QuantilesChart({
  dataSeries,
  aspectRatio,
  allLineMeta,
  selectedPoint,
  handleSetSelectedPoint,
  pointFixed,
  handleSetPointFixed
}: Props) {
  const [ref, dimensions] = useChartDimensions({}, aspectRatio);
  const refGdot = useRef<SVGGElement>(null);
  const [svgContainerRect, setContainerSvgRect] = useState<DOMRect>(null);
  const [tooltipLeftAdjust, setTooltipLeftAdjust] = useState(0);

  useEffect(() => {
    function setRects() {
      setContainerSvgRect(ref.current.getBoundingClientRect());
    }
    setRects();
    window.addEventListener('resize', setRects);
    return () => window.removeEventListener('resize', setRects);
  }, []);

  const xAccessor = (d: CycleYearQuantile) => d.cycleYearIndex + 1;
  const yAccessor = (d: CycleYearQuantile) => d.balance;

  const longestLine = dataSeries[maxIndex(dataSeries, (line) => line.length)];

  const xDomain: [number, number] = [1, longestLine.length];
  const xRange: [number, number] = [0, dimensions.boundedWidth];
  const xScale = scaleLinear().domain(xDomain).range(xRange);

  const yDomain: [number, number] = [
    0,
    max(dataSeries, (line) => max(line.map((d) => yAccessor(d))))
  ];
  const yRange: [number, number] = [dimensions.boundedHeight, 0];
  const yScale = scaleLinear().domain(yDomain).nice().range(yRange);

  const chartLine = line<CycleYearQuantile>()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  // Bottleneck, should only run when data or dimensions change
  const linePathStringArray = useMemo(
    () => dataSeries.map((line) => chartLine(line)),
    [dataSeries, dimensions.width, dimensions.height]
  );

  const linePaths = dataSeries.map((d, i) => {
    const hoveringCycle = selectedPoint && i === selectedPoint.cycleIndex;

    const cycleQuantile = d[0].quantile;

    let lineStyle: React.CSSProperties = {
      // stroke: hoveringCycle ? colors.green.dark : colors.green.normal,
      opacity: '0.8',
      strokeWidth: '3'
    };

    if (cycleQuantile === 0.9) {
      lineStyle.stroke = quantileColors.green.normal;
    } else if (cycleQuantile === 0.75) {
      lineStyle.stroke = quantileColors.blue.normal;
    } else if (cycleQuantile === 0.5) {
      lineStyle.stroke = quantileColors.purple.normal;
    } else if (cycleQuantile === 0.25) {
      lineStyle.stroke = quantileColors.yellow.normal;
    } else if (cycleQuantile === 0.1) {
      lineStyle.stroke = quantileColors.red.normal;
    }

    if (selectedPoint) {
      if (hoveringCycle) {
        lineStyle.opacity = '1';
        lineStyle.strokeWidth = '3';
      } else {
        lineStyle.opacity = '0.2';
      }
    }

    return (
      <path
        key={i}
        d={linePathStringArray[i]}
        style={{
          mixBlendMode: 'multiply',
          ...lineStyle
        }}
      ></path>
    );
  });

  useEffect(() => {
    // This effect only occurs when the cycle table is clicked
    // Which only happens when the point is fixed
    if (!selectedPoint) return;
    if (!pointFixed) return;
    moveSvgDot(selectedPoint);
  }, [selectedPoint]);

  function getCircleColor() {
    if (!selectedPoint) return;
    const pointQuantile =
      dataSeries[selectedPoint.cycleIndex][selectedPoint.yearIndex].quantile;

    let color = '';
    if (pointQuantile === 0.9) {
      color = quantileColors.green.normal;
    } else if (pointQuantile === 0.75) {
      color = quantileColors.blue.normal;
    } else if (pointQuantile === 0.5) {
      color = quantileColors.purple.normal;
    } else if (pointQuantile === 0.25) {
      color = quantileColors.yellow.normal;
    } else if (pointQuantile === 0.1) {
      color = quantileColors.red.normal;
    }
    return color;
  }

  function moveSvgDot(point: Point) {
    refGdot.current.setAttribute(
      'transform',
      `translate(${xScale(point.yearIndex + 1)},${yScale(
        yAccessor(dataSeries[point.cycleIndex][point.yearIndex])
      )})`
    );
  }

  // https://observablehq.com/@d3/multi-line-chart
  function mouseMoved(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.preventDefault();

    if (pointFixed) return;

    // Move tooltip (favor left side when available)
    let leftAdjust = e.clientX - svgContainerRect.left - window.pageXOffset;
    if (leftAdjust > tooltipWidth) {
      leftAdjust = leftAdjust - tooltipWidth;
    }
    // Alternate method which favors right side when available
    // if (leftAdjust > 690) {
    //   leftAdjust =
    //     leftAdjust - refTooltip.current.getBoundingClientRect().width;
    // }
    setTooltipLeftAdjust(leftAdjust);

    // Transform current mouse coords to domain values, adjusting for svg position and scroll
    const ym = yScale.invert(
      e.clientY -
        svgContainerRect.top -
        dimensions.marginTop +
        window.pageYOffset
    );
    const xm = xScale.invert(
      e.clientX -
        svgContainerRect.left -
        dimensions.marginLeft -
        window.pageXOffset
    );

    // Get the array index of the closest x value to current hover
    const i = clamp(Math.round(xm) - 1, 0, dataSeries[0].length - 1);

    const closestCycleIndex = leastIndex(
      dataSeries,
      (a, b) => Math.abs(yAccessor(a[i]) - ym) - Math.abs(yAccessor(b[i]) - ym)
    );

    const selectedPoint = { yearIndex: i, cycleIndex: closestCycleIndex };

    handleSetSelectedPoint(selectedPoint);

    // Move selection dot indicator to that nearest point of cursor
    moveSvgDot(selectedPoint);
  }

  function mouseLeft() {
    if (!pointFixed) handleSetSelectedPoint(null);
  }

  function mouseClicked() {
    handleSetPointFixed(!pointFixed);
  }

  return (
    dataSeries && (
      <div
        className="w-full relative cursor-pointer"
        style={{ maxWidth: `calc(60vh * ${aspectRatio})` }}
        onMouseMove={mouseMoved}
        onMouseLeave={mouseLeft}
        onMouseDown={mouseClicked}
        ref={ref}
      >
        {selectedPoint && (
          <QuantilesTooltip
            width={tooltipWidth}
            quantile={
              dataSeries[selectedPoint.cycleIndex][selectedPoint.yearIndex]
            }
            quantileStats={allLineMeta[selectedPoint.cycleIndex]}
            pointFixed={pointFixed}
            cycleLength={dataSeries[selectedPoint.cycleIndex].length - 1}
            leftAdjust={tooltipLeftAdjust}
          />
        )}
        <Chart dimensions={dimensions}>
          <Axis
            orientation="left"
            scale={yScale}
            formatTick={(d: number) => numToCurrencyShort(d)}
          />
          <Axis orientation="bottom" scale={xScale} />
          <g
            fill="none"
            stroke="#48bb78"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {linePaths}
          </g>
          <g ref={refGdot}>
            <circle
              r="4"
              fill="white"
              stroke={getCircleColor()}
              strokeWidth="3"
              opacity={selectedPoint ? '1' : '0'}
            />
          </g>
        </Chart>
      </div>
    )
  );
}
