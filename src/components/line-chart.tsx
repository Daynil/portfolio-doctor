import {
  axisBottom,
  axisLeft,
  line,
  max,
  scaleLinear,
  select,
  selectAll
} from 'd3';
import { maxIndex } from 'd3-array';
import React, { useEffect, useRef } from 'react';
import { CycleStats } from '../data/calc/portfolio-calc';
import { numToCurrencyShort } from '../utilities/format';

export type Point = {
  x: number;
  y: number;
};

export type ChartMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type D3Selection<T extends d3.BaseType> = d3.Selection<
  T,
  unknown,
  null,
  undefined
>;

type LineColorizerSimple = (line: Point[]) => React.CSSProperties;

type LineColorizerEnriched = (
  line: Point[],
  lineMeta: CycleStats
) => React.CSSProperties;

export type LineColorizer = LineColorizerSimple | LineColorizerEnriched;

type Props = {
  /** An array of points is a line, 2d array for multiple lines */
  dataSeries: Point[][];
  /** Total width of chart element including margin */
  plotWidth: number;
  /** Total height of chart element including margin */
  plotHeight: number;
  lineColorizer?: LineColorizer;
  allLineMeta?: CycleStats[];
} & typeof defaultProps;

const defaultProps = {
  margin: {
    top: 30,
    right: 20,
    bottom: 20,
    left: 70
  } as ChartMargin
};

LineChart.defaultProps = defaultProps;

export function LineChart({
  dataSeries,
  plotWidth,
  plotHeight,
  lineColorizer,
  allLineMeta,
  margin
}: Props) {
  const refSvg = useRef<SVGSVGElement>(null);
  const refGyAxis = useRef<SVGGElement>(null);
  const refGxAxis = useRef<SVGGElement>(null);

  // https://bl.ocks.org/mbostock/3019563
  const width = plotWidth - margin.left - margin.right;
  const height = plotHeight - margin.top - margin.bottom;

  const longestLine = dataSeries[maxIndex(dataSeries, (line) => line.length)];

  // const xDomain = longestLine.map((_d, i) => i + 1);
  const xScale = scaleLinear()
    .domain([1, longestLine.length])
    .range([0, width]);

  const yScale = scaleLinear()
    .domain([0, max(dataSeries, (line) => max(line.map((point) => point.y)))])
    .nice()
    .range([height, 0]);

  const chartLine = line<Point>()
    .x((_d, i) => xScale(i + 1))
    .y((d) => yScale(d.y));

  const linePathStringArray = dataSeries.map((line) => chartLine(line));

  // TODO: reactify axes and make more reusable somehow
  // (check the great react d3 post, she had exactly this)
  function yAxis(g: D3Selection<SVGGElement>) {
    selectAll('.LegendY').remove();
    g.call(axisLeft(yScale).tickFormat((d: number) => numToCurrencyShort(d)));

    g.attr('class', 'text-gray-600');

    g.selectAll('.tick').attr('class', 'tick LegendY tracking-wide text-sm');
  }

  function xAxis(g: D3Selection<SVGGElement>) {
    g.call(
      axisBottom(xScale)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

    g.attr('class', 'text-gray-600');

    g.selectAll('.tick').attr('class', 'tick LegendX tracking-wide text-sm');
    g.select('.domain').attr('class', 'text-gray');
  }

  // Draw d3 axes
  useEffect(() => {
    const gxAxis = select(refGxAxis.current);
    const gyAxis = select(refGyAxis.current);

    gxAxis.call(xAxis);
    gyAxis.call(yAxis);
  }, [dataSeries]);

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

  return (
    dataSeries && (
      <svg
        ref={refSvg}
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
        // onClick={mouseClicked}
        // onMouseMove={(e) => mouseMoved(e)}
        // onMouseLeave={mouseLeft}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          <g ref={refGyAxis}></g>
          <g ref={refGxAxis} transform={`translate(0,${height})`}></g>
          <g
            fill="none"
            stroke="#48bb78"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {linePaths}
          </g>
          {/* <g
            ref={refGdot}
            display={hoveringCycle || selectedCycle ? null : 'none'}
          >
            <circle r="3.5"></circle>
          </g> */}
        </g>
      </svg>
    )
  );
}
