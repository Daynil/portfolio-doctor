import { format as numFormat } from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import {
  CycleStats,
  CycleYearData,
  PortfolioOptions,
  PortfolioStats
} from '../data/calc/portfolio-calc';
import { baseUrl } from '../utilities/constants';
import { numToCurrency } from '../utilities/format';
import { portfolioOptionsToQueryString } from '../utilities/util';
import { HistoricCyclesChart } from './charts/historic-cycles-chart';
import { HistoricCyclesTooltip } from './charts/historic-cycles-tooltip';
import CopyIcon from './svg/copy-icon';
import ShareIcon from './svg/share-icon';

export interface PortfolioData {
  lifecyclesData: CycleYearData[][];
  lifecyclesStats: CycleStats[];
  portfolioStats: PortfolioStats;
  options: PortfolioOptions;
}

export interface Point {
  cycleIndex: number;
  yearIndex: number;
}

export function HistoricPortfolioDetails({
  lifecyclesData,
  lifecyclesStats,
  portfolioStats,
  options
}: PortfolioData) {
  const refCopyURL = useRef<HTMLInputElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point>(null);
  const [pointFixed, setPointFixed] = useState(false);

  const [showCycleDetails, setShowCycleDetails] = useState(false);

  const [copyComplete, setCopyComplete] = useState(false);
  const [copyModalActive, setCopyModalActive] = useState(false);

  useEffect(() => {
    if (!pointFixed) setShowCycleDetails(false);
  }, [pointFixed]);

  function shareResults() {
    setCopyModalActive(true);
  }

  function copyURL() {
    refCopyURL.current.select();
    document.execCommand('copy');
    setCopyComplete(true);
  }

  function closeCopyModal() {
    setCopyModalActive(false);
    setCopyComplete(false);
  }

  function getSelectedCycle() {
    if (!selectedPoint) return null;
    return lifecyclesData[selectedPoint.cycleIndex];
  }

  function getSelectedCycleStats() {
    if (!selectedPoint) return null;
    return lifecyclesStats[selectedPoint.cycleIndex];
  }

  function getSelectedYear() {
    if (!selectedPoint) return null;
    return lifecyclesData[selectedPoint.cycleIndex][selectedPoint.yearIndex];
  }

  let portfolioHealthColor = 'text-green-500';
  if (portfolioStats.successRate < 0.75)
    portfolioHealthColor = 'text-yellow-500';
  if (portfolioStats.successRate < 0.5) portfolioHealthColor = 'text-red-500';

  function getTooltip(cycle: CycleYearData) {
    return (
      <HistoricCyclesTooltip
        width={325}
        yearData={cycle}
        cycleLength={options.simulationYearsLength}
        pointFixed={false}
        leftAdjust={0}
      />
    );
  }

  return !lifecyclesData ? null : (
    <div className="flex flex-row flex-wrap">
      <div
        className={
          copyModalActive ? 'fixed inset-0 transition-opacity z-10' : 'hidden'
        }
        onClick={closeCopyModal}
      >
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <div className="flex flex-wrap w-full">
        <div className="w-full">
          <HistoricCyclesChart
            dataSeries={lifecyclesData}
            aspectRatio={1000 / 600}
            allLineMeta={lifecyclesStats}
            selectedPoint={selectedPoint}
            handleSetSelectedPoint={(point: Point) => setSelectedPoint(point)}
            pointFixed={pointFixed}
            handleSetPointFixed={(fixed: boolean) => setPointFixed(fixed)}
          />
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
                  {numFormat('.2%')(portfolioStats.successRate)}
                </span>
              </div>
            </div>
            <div className="my-2 mx-auto bg-gray-500 w-5/6 h-px"></div>
            <div className="pt-2">
              <label className="text-gray-600 font-semibold tracking-wide block">
                Average Ending Balance
              </label>
              <span className="text-xl">
                {numToCurrency(portfolioStats.balance.averageInflAdj, 0)}
              </span>
            </div>
            <div className="pt-2">
              <label className="text-gray-600 font-semibold tracking-wide block">
                Average Withdrawal
              </label>
              <span className="text-xl">
                {numToCurrency(portfolioStats.withdrawals.averageInflAdj, 0)}
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
              <div
                className={
                  copyModalActive
                    ? 'absolute bg-white shadow-lg rounded-md -mt-32 -mx-16 text-base p-4 flex flex-col z-20'
                    : 'hidden'
                }
              >
                <div className="text-gray-900">
                  Share this portfolio run with this URL or just bookmark it for
                  future reference
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    className="form-input w-full"
                    value={`${baseUrl}/simulator?${portfolioOptionsToQueryString(
                      options
                    )}`}
                    readOnly
                    ref={refCopyURL}
                  />
                  <button
                    className="btn btn-green ml-2 flex items-center"
                    onClick={copyURL}
                  >
                    <CopyIcon className="text-white w-4" />
                    <span className="ml-2">Copy</span>
                  </button>
                </div>
                {!copyComplete ? null : (
                  <div
                    className="bg-green-100 border-l-4 border-green-500 text-green-700 py-2 px-4 mt-4"
                    role="alert"
                  >
                    Copied to clipboard!
                  </div>
                )}
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
                  {portfolioStats.balance.min.balanceInflAdj < 0
                    ? numToCurrency(0)
                    : numToCurrency(
                        portfolioStats.balance.min.balanceInflAdj,
                        0
                      )}
                </td>
                <td className="text-right pr-4" rowSpan={3}>
                  {numToCurrency(
                    getSelectedCycleStats()?.balance.endingInflAdj,
                    0
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label my-0 font-normal block">
                    Average
                  </label>
                </td>
                <td className="text-right">
                  {numToCurrency(portfolioStats.balance.averageInflAdj, 0)}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label my-0 font-normal block">
                    Maximum
                  </label>
                </td>
                <td className="text-right">
                  {numToCurrency(portfolioStats.balance.max.balanceInflAdj, 0)}
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
                  {numToCurrency(
                    portfolioStats.withdrawals.min.amountInflAdj,
                    0
                  )}
                </td>
                <td className="text-right pr-4">
                  {numToCurrency(
                    getSelectedCycleStats()?.withdrawals.min.amountInflAdj,
                    0
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label my-0 font-normal block">
                    Average
                  </label>
                </td>
                <td className="text-right">
                  {numToCurrency(portfolioStats.withdrawals.averageInflAdj, 0)}
                </td>
                <td className="text-right pr-4">
                  {numToCurrency(
                    getSelectedCycleStats()?.withdrawals.averageInflAdj,
                    0
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label my-0 font-normal block">
                    Maximum
                  </label>
                </td>
                <td className="text-right">
                  {numToCurrency(
                    portfolioStats.withdrawals.max.amountInflAdj,
                    0
                  )}
                </td>
                <td className="text-right pr-4">
                  {numToCurrency(
                    getSelectedCycleStats()?.withdrawals.max.amountInflAdj,
                    0
                  )}
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
        <button
          className="btn btn-green-2"
          onClick={() => setShowCycleDetails(!showCycleDetails)}
          disabled={!selectedPoint || !pointFixed}
        >
          {showCycleDetails ? 'Hide' : 'Show'} Cycle Details
        </button>

        {!selectedPoint || !showCycleDetails ? null : (
          <table className="mt-4 border-collapse">
            <thead>
              <tr className="bg-green-500 text-white text-right">
                <th className="p-2">Year</th>
                <th className="p-2">Ending Balance</th>
                <th className="p-2">Withdrawal</th>
              </tr>
            </thead>
            <tbody>
              {lifecyclesData[selectedPoint.cycleIndex].map((yearData, i) => (
                <tr
                  key={i + 1}
                  className="group transition-colors even:bg-gray-200"
                >
                  <td className="group-hover:bg-gray-400 duration-200 text-right p-2">
                    {yearData.cycleYear}
                  </td>
                  <td className="group-hover:bg-gray-400 duration-200 text-right p-2">
                    {numFormat('$,.2f')(yearData.balanceInfAdjEnd)}
                  </td>
                  <td className="group-hover:bg-gray-400 duration-200 text-right p-2">
                    {numFormat('$,.2f')(yearData.withdrawalInfAdjust)}
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
