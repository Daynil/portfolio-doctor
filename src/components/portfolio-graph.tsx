import * as d3 from 'd3';
import { format } from 'd3-format';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CycleStats,
  CycleYearData,
  PortfolioOptions,
  PortfolioStats
} from '../data/calc/portfolio-calc';
import { numToCurrency, numToCurrencyShort } from '../utilities/format';
import { clamp } from '../utilities/math';
import { portfolioOptionsToQueryString } from '../utilities/util';
import ShareIcon from './svg/share-icon';

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
  const refGdot = useRef<SVGGElement>(null);
  const refTooltip = useRef<HTMLDivElement>(null);
  const [hoveringCycle, setHoveringCycle] = useState<{
    data: ChartData;
    dataIndex: number;
  }>(null);
  const [hoveringPointData, setHoveringPointData] = useState<PointData>(null);
  const [selectedCycle, setSelectedCycle] = useState<ChartData>(null);
  const [selectedPointData, setSelectedPointData] = useState<PointData>(null);
  const [showCycleDetails, setshowCycleDetails] = useState(false);

  const [svgRect, setSvgRect] = useState<DOMRect>(null);

  const tooltipWidth = 325;

  useEffect(() => {
    function setRects() {
      setSvgRect(refSvg.current.getBoundingClientRect());
    }
    setRects();
    window.addEventListener('resize', setRects);
    return () => window.removeEventListener('resize', setRects);
  }, []);

  function shareResults() {
    window.open(
      `https://portfoliodoctor.com/simulator?${portfolioOptionsToQueryString(
        options
      )}`,
      '_blank'
    );
  }

  const memoized = useMemo(() => {
    const xDomain = lifecyclesData[0].map((d, i) => i + 1);

    const xScale = d3
      .scaleLinear()
      .domain([1, lifecyclesData[0].length])
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

    const linePathStringArray = chartData.map((d) => line(d.values));

    return {
      xDomain,
      xScale,
      yScale,
      linePathStringArray
    };
  }, [lifecyclesData]);

  function yAxis(g: D3Selection<SVGGElement>) {
    d3.selectAll('.LegendY').remove();
    g.call(
      d3
        .axisLeft(memoized.yScale)
        .tickFormat((d: number) => numToCurrencyShort(d))
    );

    g.attr('class', 'text-gray-600');

    g.selectAll('.tick').attr('class', 'tick LegendY tracking-wide text-sm');
  }

  function xAxis(g: D3Selection<SVGGElement>) {
    g.call(
      d3
        .axisBottom(memoized.xScale)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

    g.attr('class', 'text-gray-600');

    g.selectAll('.tick').attr('class', 'tick LegendX tracking-wide text-sm');
    g.select('.domain').attr('class', 'text-gray');
  }

  // Draw d3 axes
  useEffect(() => {
    setHoveringCycle(null);
    setHoveringPointData(null);
    setSelectedCycle(null);
    setshowCycleDetails(false);
    setSelectedPointData(null);

    const gxAxis = d3.select(refGxAxis.current);
    const gyAxis = d3.select(refGyAxis.current);

    gxAxis.call(xAxis);
    gyAxis.call(yAxis);
  }, [lifecyclesData]);

  // https://observablehq.com/@d3/multi-line-chart
  function mouseMoved(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.preventDefault();

    if (selectedCycle) return;

    // Move tooltip (favor left side when available)
    if (refTooltip.current) {
      let leftAdjust = e.clientX - svgRect.left - window.pageXOffset;
      if (leftAdjust > tooltipWidth) {
        leftAdjust = leftAdjust - tooltipWidth;
      }
      // Alternate method which favors right side when available
      // if (leftAdjust > 690) {
      //   leftAdjust =
      //     leftAdjust - refTooltip.current.getBoundingClientRect().width;
      // }
      refTooltip.current.style.left = leftAdjust + 'px';
    }

    // Transform current mouse coords to domain values, adjusting for svg position and scroll
    const ym = memoized.yScale.invert(
      //d3.event.layerY - svgRect.top - margin.top - window.pageYOffset
      e.clientY - svgRect.top - margin.top + window.pageYOffset
    );
    const xm = memoized.xScale.invert(
      //d3.event.layerX - svgRect.left - margin.left - window.pageXOffset
      e.clientX - svgRect.left - margin.left - window.pageXOffset
    );

    // Get the array index of the closest x value to current hover
    const i = clamp(Math.round(xm) - 1, 0, memoized.xDomain.length - 1);

    // Find the data for the line at the current x position
    // closest in y value to the current y position
    const highlightLineData = chartData.reduce((a, b) => {
      return Math.abs(a.values[i].y - ym) < Math.abs(b.values[i].y - ym)
        ? a
        : b;
    });

    setHoveringCycle({ data: highlightLineData, dataIndex: i });

    // Move selection dot indicator to that nearest point of cursor
    refGdot.current.setAttribute(
      'transform',
      `translate(${memoized.xScale(memoized.xDomain[i])},${memoized.yScale(
        highlightLineData.values[i].y
      )})`
    );
  }

  function mouseClicked() {
    if (selectedCycle) {
      setSelectedCycle(null);
      setshowCycleDetails(false);
      setSelectedPointData(null);
    } else {
      setSelectedCycle(hoveringCycle.data);
      setSelectedPointData(hoveringPointData);
    }
  }

  function mouseLeft() {
    setHoveringCycle(null);
    setHoveringPointData(null);
  }

  const pointData = selectedPointData ? selectedPointData : hoveringPointData;

  useEffect(() => {
    if (!hoveringCycle) setHoveringPointData(null);
    else {
      setHoveringPointData({
        yearsAfterPortfolioStart: hoveringCycle.dataIndex + 1,
        currYear: hoveringCycle.data.startYear + hoveringCycle.dataIndex + 1,
        cycleStartYear: hoveringCycle.data.startYear,
        cycleEndYear: hoveringCycle.data.startYear + memoized.xDomain.length,
        currEndingBalanceInflAdj:
          hoveringCycle.data.values[hoveringCycle.dataIndex].y,
        currYearWithdrawalInflAdj:
          hoveringCycle.data.values[hoveringCycle.dataIndex].withdrawal,
        lastEndingBalanceInflAdj:
          hoveringCycle.data.stats.balance.endingInflAdj,
        cycleAvgWithdrawal: hoveringCycle.data.stats.withdrawals.averageInflAdj,
        cycleMinWithdrawal:
          hoveringCycle.data.stats.withdrawals.min.amountInflAdj,
        cycleMaxWithdrawal:
          hoveringCycle.data.stats.withdrawals.max.amountInflAdj
      });
    }
  }, [hoveringCycle]);

  const linePaths = chartData.map((d, i) => {
    let pathStrokeColor: string;
    // Red
    if (d.stats.failureYear) pathStrokeColor = '#F56565';
    // Yellow
    else if (d.stats.nearFailure) pathStrokeColor = '#FFD600';
    else '#48BB78'; // Green

    let pathOpacity = '0.1';
    let pathStrokeWidth = '1.5';
    if (hoveringCycle) {
      if (hoveringCycle.data.startYear === d.startYear) {
        // This is the hovered line
        // Red
        if (d.stats.failureYear) pathStrokeColor = '#E53E3E';
        // Yellow
        else if (d.stats.nearFailure) pathStrokeColor = '#FFD600';
        else '#38A169'; // Green
        pathOpacity = '1';
        pathStrokeWidth = '3';
      }
    } else {
      if (selectedCycle) {
        if (selectedCycle.startYear === d.startYear) {
          // This is the selected line
          // Red
          if (d.stats.failureYear) pathStrokeColor = '#E53E3E';
          // Yellow
          else if (d.stats.nearFailure) pathStrokeColor = '#FFD600';
          else '#38A169'; // Green
          pathOpacity = '1';
          pathStrokeWidth = '3';
        }
      }
    }

    if (!hoveringCycle && !selectedCycle) {
      // We're not hovering and don't have anything selected
      pathOpacity = '0.8';
    }

    return (
      <path
        key={d.startYear}
        d={memoized.linePathStringArray[i]}
        style={{
          mixBlendMode: 'multiply',
          opacity: pathOpacity,
          stroke: pathStrokeColor,
          strokeWidth: pathStrokeWidth
        }}
      ></path>
    );
  });

  let portfolioHealthColor = 'text-green-500';
  if (stats.successRate < 0.75) portfolioHealthColor = 'text-yellow-500';
  if (stats.successRate < 0.5) portfolioHealthColor = 'text-red-500';

  return !lifecyclesData ? null : (
    <div className="flex flex-row flex-wrap">
      <div className="fixed inset-0 transition-opacity">
        <div className="absolute inset-0 bg-gray-500 opacity-75 z-10"></div>
      </div>
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
                width: `${tooltipWidth}px`,
                height: '11rem',
                top: '26px'
              }}
              className="absolute inset-y-0 inset-x-0 pointer-events-none bg-gray-100 rounded-md p-4 shadow-md"
            >
              <div className="flex justify-evenly">
                <div className="flex flex-col">
                  <label className="form-label my-0">Start Year</label>
                  <span>{pointData.cycleStartYear}</span>
                </div>
                <div className="flex flex-col">
                  <label className="form-label my-0">Current Year</label>
                  <span>{pointData.currYear}</span>
                </div>
                <div className="flex flex-col">
                  <label className="form-label my-0">End Year</label>
                  <span>
                    {pointData.cycleStartYear + options.simulationYearsLength}
                  </span>
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
          className="rounded-md pb-4 border-2 border-gray-300 m-6"
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
                <span className={'text-2xl font-bold ' + portfolioHealthColor}>
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
            <div className="my-2 mx-auto bg-gray-500 w-5/6 h-px"></div>
            <div className="pt-2 w-full flex justify-center relative">
              <button
                className="btn btn-green-2 flex items-center"
                onClick={shareResults}
              >
                <ShareIcon className="text-green-700 w-4" />
                <span className="ml-2">Share</span>
              </button>
              <div className="absolute bg-white shadow-lg rounded-md -mt-32 -mx-16 text-base p-4 flex flex-col">
                <div className="text-gray-900">
                  You can share this portfolio run with the URL or just bookmark
                  it for future reference.
                </div>
                <div className="flex mt-2">
                  <input type="text" className="form-input w-full" />
                  <button className="btn btn-green ml-2">Copy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-md overflow-hidden border-2 m-6 self-center">
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
      <div className="ml-6">
        {!selectedCycle ? null : (
          <button
            className="btn btn-green-2"
            onClick={() => setshowCycleDetails(!showCycleDetails)}
          >
            {showCycleDetails ? 'Hide' : 'Show'} Cycle Details
          </button>
        )}
        {!selectedCycle || !showCycleDetails ? null : (
          <table className="mt-4 border-collapse">
            <thead>
              <tr className="bg-green-500 text-white text-right">
                <th className="p-2">Year</th>
                <th className="p-2">Ending Balance</th>
                <th className="p-2">Withdrawal</th>
              </tr>
            </thead>
            <tbody>
              {lifecyclesData
                .find(
                  (cycle) => cycle[0].cycleStartYear === selectedCycle.startYear
                )
                .map((yearData, i) => (
                  <tr
                    key={i + 1}
                    className="group transition-colors even:bg-gray-200"
                  >
                    <td className="group-hover:bg-gray-400 duration-200 text-right p-2">
                      {yearData.cycleYear}
                    </td>
                    <td className="group-hover:bg-gray-400 duration-200 text-right p-2">
                      {format('$,.2f')(yearData.balanceInfAdjEnd)}
                    </td>
                    <td className="group-hover:bg-gray-400 duration-200 text-right p-2">
                      {format('$,.2f')(yearData.withdrawalInfAdjust)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
