import { line, max, scaleLinear } from 'd3';
import { maxIndex } from 'd3-array';
import React, { useRef } from 'react';
import { numToCurrencyShort } from '../../utilities/format';
import { useChartDimensions } from '../../utilities/hooks';
import { Axis } from './axis';
import { Chart } from './chart';
// import { AxisBottom } from './axis';
// import { AxisLeft } from './axis-left';

export type Point = {
  x: number;
  y: number;
};

export type D3Selection<T extends d3.BaseType> = d3.Selection<
  T,
  unknown,
  null,
  undefined
>;

type LineColorizerSimple = (line: Point[]) => React.CSSProperties;

type LineColorizerEnriched<D> = (
  line: Point[],
  lineMeta: D
) => React.CSSProperties;

export type LineColorizer<D> = LineColorizerSimple | LineColorizerEnriched<D>;

type Props<T, D> = {
  /** An array of points is a line, 2d array for multiple lines */
  dataSeries: Point[][];
  /** Chart's aspect ratio */
  aspectRatio: number;
  /** Conditions for determining the color or each line */
  lineColorizer?: LineColorizer<D>;
  /** Additional metadata about each point */
  allPointMeta?: T[][]; //CycleYearData[][];
  /** Additional metadata about each line */
  allLineMeta?: D[]; //CycleStats[];
};

export function LineChart<T, D>({
  dataSeries,
  aspectRatio,
  lineColorizer,
  allLineMeta
}: Props<T, D>) {
  // const refSvg = useRef<SVGSVGElement>(null);
  const [ref, dimensions] = useChartDimensions({}, aspectRatio);
  const refGdot = useRef<SVGGElement>(null);
  // const [svgRect, setSvgRect] = useState<DOMRect>(null);

  // useEffect(() => {
  //   function setRects() {
  //     setSvgRect(refSvg.current.getBoundingClientRect());
  //   }
  //   setRects();
  //   window.addEventListener('resize', setRects);
  //   return () => window.removeEventListener('resize', setRects);
  // }, []);

  // https://bl.ocks.org/mbostock/3019563
  // const width = plotWidth - margin.left - margin.right;
  // const height = plotHeight - margin.top - margin.bottom;

  const longestLine = dataSeries[maxIndex(dataSeries, (line) => line.length)];

  const xDomain: [number, number] = [1, longestLine.length];
  const xRange: [number, number] = [0, dimensions.boundedWidth];
  const xScale = scaleLinear().domain(xDomain).range(xRange);

  const yDomain: [number, number] = [
    0,
    max(dataSeries, (line) => max(line.map((point) => point.y)))
  ];
  const yRange: [number, number] = [dimensions.boundedHeight, 0];
  const yScale = scaleLinear().domain(yDomain).nice().range(yRange);

  const chartLine = line<Point>()
    .x((_d, i) => xScale(i + 1))
    .y((d) => yScale(d.y));

  const linePathStringArray = dataSeries.map((line) => chartLine(line));

  const linePaths = dataSeries.map((line, i) => {
    let lineStyle = lineColorizer(line, allLineMeta[i]);
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
          // opacity: pathOpacity,
          // stroke: pathStrokeColor,
          // strokeWidth: pathStrokeWidth
        }}
      ></path>
    );
  });

  // https://observablehq.com/@d3/multi-line-chart
  // function mouseMoved(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
  //   e.preventDefault();

  //   // if (selectedCycle) return;

  //   // Move tooltip (favor left side when available)
  //   // if (refTooltip.current) {
  //   //   let leftAdjust = e.clientX - svgRect.left - window.pageXOffset;
  //   //   if (leftAdjust > tooltipWidth) {
  //   //     leftAdjust = leftAdjust - tooltipWidth;
  //   //   }
  //   //   // Alternate method which favors right side when available
  //   //   // if (leftAdjust > 690) {
  //   //   //   leftAdjust =
  //   //   //     leftAdjust - refTooltip.current.getBoundingClientRect().width;
  //   //   // }
  //   //   refTooltip.current.style.left = leftAdjust + 'px';
  //   // }

  //   // Transform current mouse coords to domain values, adjusting for svg position and scroll
  //   const ym = yScale.invert(
  //     //d3.event.layerY - svgRect.top - margin.top - window.pageYOffset
  //     e.clientY - svgRect.top - margin.top + window.pageYOffset
  //   );
  //   const xm = xScale.invert(
  //     //d3.event.layerX - svgRect.left - margin.left - window.pageXOffset
  //     e.clientX - svgRect.left - margin.left - window.pageXOffset
  //   );

  //   // Get the array index of the closest x value to current hover
  //   const i = clamp(Math.round(xm) - 1, 0, dataSeries[0].length - 1);

  //   // Find the data for the line at the current x position
  //   // closest in y value to the current y position
  //   const highlightLineData = dataSeries.reduce((a, b) => {
  //     return Math.abs(a[i].y - ym) < Math.abs(b[i].y - ym) ? a : b;
  //   });

  //   // setHoveringCycle({ data: highlightLineData, dataIndex: i });

  //   // Move selection dot indicator to that nearest point of cursor
  //   refGdot.current.setAttribute(
  //     'transform',
  //     `translate(${xScale(i + 1)},${yScale(highlightLineData[i].y)})`
  //   );
  // }

  return (
    dataSeries && (
      <div
        className="w-full"
        style={{ maxWidth: `calc(60vh * ${aspectRatio})` }}
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
