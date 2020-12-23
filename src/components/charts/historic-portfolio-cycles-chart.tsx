import { line, max, scaleLinear, scan } from 'd3';
import { maxIndex } from 'd3-array';
import React, { useEffect, useRef, useState } from 'react';
import { CycleStats, CycleYearData } from '../../data/calc/portfolio-calc';
import { numToCurrencyShort } from '../../utilities/format';
import { useChartDimensions } from '../../utilities/hooks';
import { clamp } from '../../utilities/math';
import { Axis } from './axis';
import { Chart } from './chart';

export type D3Selection<T extends d3.BaseType> = d3.Selection<
  T,
  unknown,
  null,
  undefined
>;

type Props = {
  /** An array of points is a line, 2d array for multiple lines */
  dataSeries: CycleYearData[][];
  /** Chart's aspect ratio */
  aspectRatio: number;
  /** Additional metadata about each line */
  allLineMeta?: CycleStats[];
};

export type Point = {
  cycleIndex: number;
  yearIndex: number;
};

export function HistoricPortfolioCyclesChart({
  dataSeries,
  aspectRatio,
  allLineMeta
}: Props) {
  const [ref, dimensions] = useChartDimensions({}, aspectRatio);
  const refGdot = useRef<SVGGElement>(null);
  const [svgContainerRect, setContainerSvgRect] = useState<DOMRect>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point>(null);
  const [pointFixed, setPointFixed] = useState(false);

  useEffect(() => {
    function setRects() {
      setContainerSvgRect(ref.current.getBoundingClientRect());
    }
    setRects();
    window.addEventListener('resize', setRects);
    return () => window.removeEventListener('resize', setRects);
  }, []);

  const xAccessor = (d: CycleYearData) => d.cycleYear - d.cycleStartYear + 1;
  const yAccessor = (d: CycleYearData) => d.balanceInfAdjEnd;

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

  const chartLine = line<CycleYearData>()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  const linePathStringArray = dataSeries.map((line) => chartLine(line));

  const linePaths = dataSeries.map((lineData, i) => {
    const lineStyle: React.CSSProperties = {
      stroke: '#48BB78', // Green
      opacity: '0.8',
      strokeWidth: '1.5'
    };

    // Red
    if (allLineMeta[i].failureYear) lineStyle.stroke = '#F56565';
    // Yellow
    else if (allLineMeta[i].nearFailure) lineStyle.stroke = '#FFD600';

    // let pathStrokeColor = '#48BB78'; // Green
    // // Red
    // if (d.stats.failureYear) pathStrokeColor = '#F56565';
    // // Yellow
    // else if (d.stats.nearFailure) pathStrokeColor = '#FFD600';
    // else '#48BB78'; // Green

    // let pathOpacity = '0.1';
    // let pathStrokeWidth = '1.5';
    // if (hoveringCycle) {
    //   if (hoveringCycle.data.startYear === d.startYear) {
    //     // This is the hovered line
    //     // Red
    //     if (d.stats.failureYear) pathStrokeColor = '#E53E3E';
    //     // Yellow
    //     else if (d.stats.nearFailure) pathStrokeColor = '#FFD600';
    //     else '#38A169'; // Green
    //     pathOpacity = '1';
    //     pathStrokeWidth = '3';
    //   }
    // } else {
    //   if (selectedCycle) {
    //     if (selectedCycle.startYear === d.startYear) {
    //       // This is the selected line
    //       // Red
    //       if (d.stats.failureYear) pathStrokeColor = '#E53E3E';
    //       // Yellow
    //       else if (d.stats.nearFailure) pathStrokeColor = '#FFD600';
    //       else '#38A169'; // Green
    //       pathOpacity = '1';
    //       pathStrokeWidth = '3';
    //     }
    //   }
    // }

    // if (!hoveringCycle && !selectedCycle) {
    //   // We're not hovering and don't have anything selected
    //   pathOpacity = '0.8';
    // }

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

  // https://observablehq.com/@d3/multi-line-chart
  function mouseMoved(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.preventDefault();

    // if (selectedCycle) return;

    // Move tooltip (favor left side when available)
    // if (refTooltip.current) {
    //   let leftAdjust = e.clientX - svgRect.left - window.pageXOffset;
    //   if (leftAdjust > tooltipWidth) {
    //     leftAdjust = leftAdjust - tooltipWidth;
    //   }
    //   // Alternate method which favors right side when available
    //   // if (leftAdjust > 690) {
    //   //   leftAdjust =
    //   //     leftAdjust - refTooltip.current.getBoundingClientRect().width;
    //   // }
    //   refTooltip.current.style.left = leftAdjust + 'px';
    // }

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

    const closestCycleIndex = scan(
      dataSeries,
      (a, b) => Math.abs(yAccessor(a[i]) - ym) - Math.abs(yAccessor(b[i]) - ym)
    );

    // setHoveringCycle({ data: highlightLineData, dataIndex: i });

    // setSelectedPoint({ yearIndex: i, cycleIndex: closestCycleIndex });

    // Move selection dot indicator to that nearest point of cursor
    refGdot.current.setAttribute(
      'transform',
      `translate(${xScale(i + 1)},${yScale(
        yAccessor(dataSeries[closestCycleIndex][i])
      )})`
    );
  }

  return (
    dataSeries && (
      <div
        className="w-full"
        style={{ maxWidth: `calc(60vh * ${aspectRatio})` }}
        onMouseMove={mouseMoved}
        ref={ref}
      >
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
          <g
            ref={refGdot}
            // display={hoveringCycle || selectedCycle ? null : 'none'}
          >
            <circle r="3.5"></circle>
          </g>
        </Chart>
      </div>
    )
    // dataSeries && (
    //   <svg
    //     ref={refSvg}
    //     width={width + margin.left + margin.right}
    //     height={height + margin.top + margin.bottom}
    //     // onClick={mouseClicked}
    //     onMouseMove={(e) => mouseMoved(e)}
    //     // onMouseLeave={mouseLeft}
    //   >
    //     <g transform={`translate(${margin.left},${margin.top})`}>
    //       <AxisLeft
    //         domain={yDomain}
    //         range={yRange}
    //         scale={yScale}
    //         tickFormat={(d: number) => numToCurrencyShort(d)}
    //       />
    //       <AxisBottom
    //         domain={xDomain}
    //         range={xRange}
    //         scale={xScale}
    //         height={height}
    //       />
    //       <g
    //         fill="none"
    //         stroke="#48bb78"
    //         strokeWidth="1.5"
    //         strokeLinejoin="round"
    //         strokeLinecap="round"
    //       >
    //         {linePaths}
    //       </g>
    //       <g
    //         ref={refGdot}
    //         // display={hoveringCycle || selectedCycle ? null : 'none'}
    //       >
    //         <circle r="3.5"></circle>
    //       </g>
    //     </g>
    //   </svg>
    // )
  );
}
