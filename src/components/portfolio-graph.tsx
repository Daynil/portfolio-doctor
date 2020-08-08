import * as d3 from 'd3';
import { format } from 'd3-format';
import React, { useEffect, useRef, useState } from 'react';
import {
  CycleStats,
  CycleYearData,
  PortfolioOptions,
  PortfolioStats
} from '../data/calc/portfolio-calc';
import { numToCurrency, numToCurrencyShort } from '../utilities/format';
import { clamp } from '../utilities/math';

export interface PortfolioData {
  lifecyclesData: CycleYearData[][];
  stats: PortfolioStats;
  chartData: ChartData[];
  options: PortfolioOptions;
  startYear: number;
}

type LineData = { x: number; y: number; withdrawal: number };
/**
 * Data formatted for chart consumption
 */
type ChartData = {
  startYear: number;
  values: LineData[];
  stats: CycleStats;
};
// cycle start year, selected year, selected balance, year max/min, year end
type PointData = {
  yearsAfterPortfolioStart: number;
  currYear: number;
  cycleStartYear: number;
  cycleEndYear: number;
  currEndingBalanceInflAdj: number;
  currYearWithdrawalInflAdj: number;
  lastEndingBalanceInflAdj: number;
  cycleAvgWithdrawal: number;
  cycleMinWithdrawal: number;
  cycleMaxWithdrawal: number;
};
type D3Selection<T extends d3.BaseType> = d3.Selection<
  T,
  unknown,
  null,
  undefined
>;
type D3LineSelection = d3.Selection<
  Element | d3.EnterElement | Document | Window | SVGPathElement,
  ChartData,
  SVGGElement,
  unknown
>;

// https://bl.ocks.org/mbostock/3019563
const margin = { top: 30, right: 20, bottom: 20, left: 70 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

export function PortfolioGraph({
  lifecyclesData,
  stats,
  chartData,
  options,
  startYear
}: PortfolioData) {
  const refSvg = useRef<SVGSVGElement>(null);
  const refGyAxis = useRef<SVGGElement>(null);
  const refGxAxis = useRef<SVGGElement>(null);
  const refGdataLines = useRef<SVGGElement>(null);
  const refGdot = useRef<SVGGElement>(null);
  const refTooltip = useRef<HTMLDivElement>(null);
  const [hoveringCycle, setHoveringCycle] = useState<ChartData>(null);
  const [hoveringPointData, setHoveringPointData] = useState<PointData>(null);
  const [selectedCycle, setSelectedCycle] = useState<ChartData>(null);
  const [selectedPointData, setSelectedPointData] = useState<PointData>(null);
  const [linePaths, setLinePaths] = useState<D3LineSelection>(null);

  const firstCycleData = lifecyclesData[0];
  const xDomain = lifecyclesData[0].map((d, i) => i + 1);

  // Hash chart data for quick access
  let chartDataHash: { [startYear: string]: ChartData } = {};
  chartData.forEach((d) => (chartDataHash[d.startYear] = d));

  const xScale = d3
    .scaleLinear()
    .domain([1, firstCycleData.length])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(lifecyclesData, (d) => d3.max(d.map((d) => d.balanceInfAdjEnd)))
    ])
    .nice()
    .range([height, 0]);

  const line = d3
    .line<LineData>()
    .x((d, i) => xScale(i + 1))
    .y((d) => yScale(d.y));

  const yAxis = (g: D3Selection<SVGGElement>) => {
    d3.selectAll('.LegendY').remove();
    g.call(
      d3.axisLeft(yScale).tickFormat((d: number) => numToCurrencyShort(d))
    );

    g.attr('class', 'text-gray-600');

    g.selectAll('.tick').attr('class', 'tick LegendY tracking-wide text-sm');
  };

  const xAxis = (g: D3Selection<SVGGElement>) => {
    g.call(
      d3
        .axisBottom(xScale)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

    g.attr('class', 'text-gray-600');

    g.selectAll('.tick').attr('class', 'tick LegendX tracking-wide text-sm');
    g.select('.domain').attr('class', 'text-gray');
  };

  function resetLineStyles(linePaths: D3LineSelection) {
    linePaths
      .style('mix-blend-mode', 'multiply')
      .style('opacity', 0.8)
      .attr('stroke', (d) => {
        return d.stats.failureYear ? '#F56565' : '#48bb78';
      })
      .attr('stroke-width', 1.5);
  }

  // https://observablehq.com/@d3/multi-line-chart
  const mouseMoved = function (e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.preventDefault();

    if (selectedCycle) return;
    const svgRect = refSvg.current.getBoundingClientRect();

    // Move tooltip (favor left side when available)
    if (refTooltip.current) {
      let leftAdjust = e.clientX - svgRect.left - window.pageXOffset;
      if (leftAdjust > refTooltip.current.getBoundingClientRect().width) {
        leftAdjust =
          leftAdjust - refTooltip.current.getBoundingClientRect().width;
      }
      // Alternate method which favors right side when available
      // if (leftAdjust > 690) {
      //   leftAdjust =
      //     leftAdjust - refTooltip.current.getBoundingClientRect().width;
      // }
      refTooltip.current.style.left = leftAdjust + 'px';
    }

    // Transform current mouse coords to domain values, adjusting for svg position and scroll
    const ym = yScale.invert(
      //d3.event.layerY - svgRect.top - margin.top - window.pageYOffset
      e.clientY - svgRect.top - margin.top - window.pageYOffset
    );
    const xm = xScale.invert(
      //d3.event.layerX - svgRect.left - margin.left - window.pageXOffset
      e.clientX - svgRect.left - margin.left - window.pageXOffset
    );

    // Get the array index of the closest x value to current hover
    const i = clamp(Math.round(xm) - 1, 0, xDomain.length - 1);

    // Find the data for the line at the current x position
    // closest in y value to the current y position
    const highlightLineData = chartData.reduce((a, b) => {
      return Math.abs(a.values[i].y - ym) < Math.abs(b.values[i].y - ym)
        ? a
        : b;
    });

    setHoveringCycle(highlightLineData);

    const lines = Array.from(
      refGdataLines.current.children
    ) as SVGPathElement[];

    // Highlight selected line
    const highlightLine = lines.filter(
      (line) =>
        ((line.className as unknown) as SVGAnimatedString).baseVal ===
        highlightLineData.startYear + ''
    )[0];

    highlightLine.setAttribute(
      'stroke',
      highlightLineData.stats.failureYear ? '#E53E3E' : '#38A169'
    );
    highlightLine.style.strokeWidth = '3';
    highlightLine.style.opacity = '1';

    lines
      .filter(
        (line: any) =>
          line.className.baseVal !== highlightLineData.startYear + ''
      )
      .forEach((line) => {
        const lineData = chartDataHash[line.className.baseVal];
        line.setAttribute(
          'stroke',
          lineData.stats.failureYear ? '#F56565' : '#48bb78'
        );
        line.style.strokeWidth = '1.5';
        line.style.opacity = '0.1';
      });

    // Move selection dot indicator to that nearest point of cursor
    refGdot.current.setAttribute(
      'transform',
      `translate(${xScale(xDomain[i])},${yScale(
        highlightLineData.values[i].y
      )})`
    );

    setHoveringPointData({
      yearsAfterPortfolioStart: i + 1,
      currYear: highlightLineData.startYear + i + 1,
      cycleStartYear: highlightLineData.startYear,
      cycleEndYear: highlightLineData.startYear + xDomain.length,
      currEndingBalanceInflAdj: highlightLineData.values[i].y,
      currYearWithdrawalInflAdj: highlightLineData.values[i].withdrawal,
      lastEndingBalanceInflAdj: highlightLineData.stats.balance.endingInflAdj,
      cycleAvgWithdrawal: highlightLineData.stats.withdrawals.averageInflAdj,
      cycleMinWithdrawal: highlightLineData.stats.withdrawals.min.amountInflAdj,
      cycleMaxWithdrawal: highlightLineData.stats.withdrawals.max.amountInflAdj
    });
  };

  const mouseClicked = function () {
    if (selectedCycle) {
      setSelectedCycle(null);
      setSelectedPointData(null);
    } else {
      setSelectedCycle(hoveringCycle);
      setSelectedPointData(hoveringPointData);
    }
  };

  const mouseLeft = function () {
    setHoveringCycle(null);
    setHoveringPointData(null);
    if (!selectedCycle) resetLineStyles(linePaths);
  };

  // Draw d3 chart
  useEffect(() => {
    setHoveringCycle(null);
    setHoveringPointData(null);
    setSelectedCycle(null);
    setSelectedPointData(null);

    const gxAxis = d3.select(refGxAxis.current);
    const gyAxis = d3.select(refGyAxis.current);
    const gDataLines = d3.select(refGdataLines.current);

    gxAxis.call(xAxis);
    gyAxis.call(yAxis);

    const linePaths = gDataLines
      .selectAll('path')
      .data(chartData)
      .join('path')
      .attr('d', (d) => line(d.values))
      .attr('class', (d) => d.startYear);

    setLinePaths(linePaths);
    resetLineStyles(linePaths);
  }, [lifecyclesData]);

  const pointData = selectedPointData ? selectedPointData : hoveringPointData;

  return !lifecyclesData ? null : (
    <div className="flex flex-wrap">
      <div className="relative">
        <svg
          ref={refSvg}
          width={width + margin.left + margin.right}
          height={height + margin.top + margin.bottom}
          onClick={mouseClicked}
          onMouseMove={(e) => mouseMoved(e)}
          onMouseLeave={mouseLeft}
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            <g ref={refGyAxis}></g>
            <g ref={refGxAxis} transform={`translate(0,${height})`}></g>
            <g
              ref={refGdataLines}
              fill="none"
              stroke="#48bb78"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></g>
            <g
              ref={refGdot}
              display={hoveringCycle || selectedCycle ? null : 'none'}
            >
              <circle r="3.5"></circle>
            </g>
          </g>
        </svg>
        {!pointData ? null : (
          <div
            ref={refTooltip}
            style={{
              width: '17rem',
              height: '11rem',
              top: '26px'
            }}
            className="absolute inset-y-0 inset-x-0 pointer-events-none bg-gray-100 rounded-md p-4 shadow-md"
          >
            <div className="flex justify-evenly">
              <div className="flex flex-col">
                <label className="form-label my-0">Current Year</label>
                <span>{pointData.currYear}</span>
              </div>
              <div className="flex flex-col">
                <label className="form-label my-0">Start Year</label>
                <span>{pointData.cycleStartYear}</span>
              </div>
            </div>
            <div className="my-3 bg-gray-400 w-full h-px"></div>
            <div className="flex justify-between mt-2">
              <label className="form-label my-0">Balance</label>
              <span>
                {numToCurrency(pointData.currEndingBalanceInflAdj, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <label className="form-label my-0">Withdrawal</label>
              <span>
                {numToCurrency(pointData.currYearWithdrawalInflAdj, 0)}
              </span>
            </div>
            <div className="text-gray-500 text-sm text-center mt-2 font-semibold">
              Click to {selectedPointData ? 'release' : 'freeze'} point
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          width: '16rem',
          height: 'fit-content'
        }}
        className="rounded-md pb-4 border-2 border-gray-300 m-6 overflow-hidden"
      >
        <div className="bg-gray-300 text-gray-700 font-semibold py-1 text-center w-full">
          Portfolio Health
        </div>
        <div className="px-2 text-center">
          <div className="text-center">
            <div className="pt-2">
              <label className="text-gray-600 font-semibold tracking-wide block">
                Success
              </label>
              <span className="text-2xl text-green-400 font-bold">
                {format('.2%')(stats.successRate)}
              </span>
            </div>
          </div>
          <div className="my-2 mx-auto bg-gray-500 w-5/6 h-px"></div>
          <div className="pt-2">
            <label className="text-gray-600 font-semibold tracking-wide block">
              Average Ending Balance
            </label>
            <span className="text-xl">
              {numToCurrency(stats.balance.averageInflAdj, 0)}
            </span>
          </div>
          <div className="pt-2">
            <label className="text-gray-600 font-semibold tracking-wide block">
              Average Withdrawal
            </label>
            <span className="text-xl">
              {numToCurrency(stats.withdrawals.averageInflAdj, 0)}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-md overflow-hidden border-2 m-6">
        <table>
          <thead>
            <tr>
              <td className="p-0" colSpan={4}>
                <div className="pt-1 bg-gray-300"></div>
              </td>
            </tr>
            <tr>
              <th className="bg-gray-300" style={{ width: '12rem' }}></th>
              <th
                colSpan={2}
                className="text-right text-gray-700 bg-gray-300 font-semibold"
                style={{ width: '14rem' }}
              >
                Portfolio
              </th>
              <th
                className="text-right pr-4 text-gray-700 bg-gray-300 font-semibold"
                style={{ width: '10rem' }}
              >
                Cycle
              </th>
            </tr>
            <tr>
              <td className="p-0" colSpan={4}>
                <div className="py-1 bg-gray-300"></div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-0" colSpan={4}>
                <div className="py-1"></div>
              </td>
            </tr>
            <tr>
              <td className="pl-4 text-gray-700 font-semibold" rowSpan={3}>
                Ending Balance
              </td>
              <td>
                <label className="form-label my-0 font-normal block">
                  Minimum
                </label>
              </td>
              <td className="text-right">
                {stats.balance.min.balanceInflAdj < 0
                  ? numToCurrency(0)
                  : numToCurrency(stats.balance.min.balanceInflAdj, 0)}
              </td>
              <td className="text-right pr-4" rowSpan={3}>
                {numToCurrency(pointData?.lastEndingBalanceInflAdj, 0)}
              </td>
            </tr>
            <tr>
              <td>
                <label className="form-label my-0 font-normal block">
                  Average
                </label>
              </td>
              <td className="text-right">
                {numToCurrency(stats.balance.averageInflAdj, 0)}
              </td>
            </tr>
            <tr>
              <td>
                <label className="form-label my-0 font-normal block">
                  Maximum
                </label>
              </td>
              <td className="text-right">
                {numToCurrency(stats.balance.max.balanceInflAdj, 0)}
              </td>
            </tr>
            <tr>
              <td colSpan={4}>
                <div className="h-px bg-gray-500 my-2"></div>
              </td>
            </tr>
            <tr>
              <td className="pl-4 text-gray-700 font-semibold" rowSpan={3}>
                Annual Withdrawal
              </td>
              <td>
                <label className="form-label my-0 font-normal block">
                  Minimum
                </label>
              </td>
              <td className="text-right">
                {numToCurrency(stats.withdrawals.min.amountInflAdj, 0)}
              </td>
              <td className="text-right pr-4">
                {numToCurrency(pointData?.cycleMinWithdrawal, 0)}
              </td>
            </tr>
            <tr>
              <td>
                <label className="form-label my-0 font-normal block">
                  Average
                </label>
              </td>
              <td className="text-right">
                {numToCurrency(stats.withdrawals.averageInflAdj, 0)}
              </td>
              <td className="text-right pr-4">
                {numToCurrency(pointData?.cycleAvgWithdrawal, 0)}
              </td>
            </tr>
            <tr>
              <td>
                <label className="form-label my-0 font-normal block">
                  Maximum
                </label>
              </td>
              <td className="text-right">
                {numToCurrency(stats.withdrawals.max.amountInflAdj, 0)}
              </td>
              <td className="text-right pr-4">
                {numToCurrency(pointData?.cycleMaxWithdrawal, 0)}
              </td>
            </tr>
            <tr>
              <td colSpan={4}>
                <div className="my-2"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
