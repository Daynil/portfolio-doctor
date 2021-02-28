import { format as numFormat } from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import {
  CycleStats,
  CycleYearData,
  CycleYearQuantile,
  PortfolioOptions,
  PortfolioStats
} from '../data/calc/portfolio-calc';
import { baseUrl } from '../utilities/constants';
import { numToCurrency } from '../utilities/format';
import { portfolioOptionsToQueryString } from '../utilities/util';
import { HistoricCyclesChart } from './charts/historic-cycles-chart';
import { QuantilesChart } from './charts/quantiles-chart';
import CopyIcon from './svg/copy-icon';
import ShareIcon from './svg/share-icon';

export interface PortfolioData {
  lifecyclesData: CycleYearData[][];
  lifecyclesStats: CycleStats[];
  portfolioStats: PortfolioStats;
  quantiles: CycleYearQuantile[][];
  options: PortfolioOptions;
}

export interface Point {
  cycleIndex: number;
  yearIndex: number;
}

export type DisplayMode = 'Full' | 'Quantiles';

export function HistoricPortfolioDetails({
  lifecyclesData,
  lifecyclesStats,
  portfolioStats,
  quantiles,
  options
}: PortfolioData) {
  const refCopyURL = useRef<HTMLInputElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point>(null);
  const [pointFixed, setPointFixed] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('Full');

  const [showCycleDetails, setShowCycleDetails] = useState(false);

  const [copyComplete, setCopyComplete] = useState(false);
  const [copyModalActive, setCopyModalActive] = useState(false);

  useEffect(() => {
    setPointFixed(null);
    setSelectedPoint(null);
  }, [lifecyclesData]);

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

  function handleDisplayModeSwitch(displayMode: DisplayMode) {
    setPointFixed(null);
    setSelectedPoint(null);
    setDisplayMode(displayMode);
  }

  let portfolioHealthColor = 'text-green-500';
  if (portfolioStats.successRate < 0.75)
    portfolioHealthColor = 'text-yellow-500';
  if (portfolioStats.successRate < 0.5) portfolioHealthColor = 'text-red-500';

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
        <div className="flex flex-row w-full justify-between ml-20">
          <div className="flex flex-row w-64">
            <button
              className={
                displayMode === 'Full' ? 'btn btn-green-2' : 'btn btn-gray'
              }
              onClick={() => handleDisplayModeSwitch('Full')}
            >
              All Cycles
            </button>
            <button
              className={
                (displayMode === 'Full' ? 'btn btn-gray' : 'btn btn-green-2') +
                ' ml-6'
              }
              onClick={() => handleDisplayModeSwitch('Quantiles')}
            >
              Quantiles
            </button>
          </div>
          <div className="flex justify-center relative mr-12">
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
                  ? 'absolute bg-white shadow-lg rounded-md mt-14 mr-64 text-base p-4 w-96 flex flex-col z-20'
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
        <div className="w-full">
          {displayMode === 'Full' ? (
            <HistoricCyclesChart
              dataSeries={lifecyclesData}
              aspectRatio={1000 / 600}
              allLineMeta={lifecyclesStats}
              selectedPoint={selectedPoint}
              handleSetSelectedPoint={(point: Point) => setSelectedPoint(point)}
              pointFixed={pointFixed}
              handleSetPointFixed={(fixed: boolean) => setPointFixed(fixed)}
            />
          ) : (
            <QuantilesChart
              dataSeries={quantiles}
              aspectRatio={1000 / 600}
              selectedPoint={selectedPoint}
              handleSetSelectedPoint={(point: Point) => setSelectedPoint(point)}
              pointFixed={pointFixed}
              handleSetPointFixed={(fixed: boolean) => setPointFixed(fixed)}
            />
          )}
        </div>
        <div
          style={{
            height: 'fit-content'
          }}
          className="rounded-md pb-4 border-2 border-gray-300 m-6"
        >
          <div className="bg-gray-300 text-gray-700 font-semibold py-1 text-center w-full">
            Portfolio Health
          </div>
          <div className="flex items-center justify-center px-2 text-center">
            <div className="text-center">
              <div className="flex flex-col pt-2 mx-4">
                <label className="text-gray-600 font-semibold tracking-wide block">
                  Success
                </label>
                <span className={'text-2xl font-bold ' + portfolioHealthColor}>
                  {numFormat('.2%')(portfolioStats.successRate)}
                </span>
                <span className="text-gray-600 text-sm mt-1">
                  {portfolioStats.numSuccesses} out of{' '}
                  {portfolioStats.numFailures + portfolioStats.numSuccesses}
                </span>
              </div>
            </div>
            <div className="bg-gray-500 w-px h-24"></div>
            <div className="text-center">
              <div className="flex flex-col pt-2 mx-4">
                <label className="text-gray-600 font-semibold tracking-wide block w-32">
                  Low Ending Balance
                </label>
                <span className={'text-2xl font-bold text-gray-700'}>
                  {numFormat('.2%')(
                    portfolioStats.numNearFailures /
                      (portfolioStats.numFailures + portfolioStats.numSuccesses)
                  )}
                </span>
                <span className="text-gray-600 text-sm mt-1">
                  {portfolioStats.numNearFailures} out of{' '}
                  {portfolioStats.numFailures + portfolioStats.numSuccesses}
                </span>
              </div>
            </div>
            <div className="bg-gray-500 w-px h-24"></div>
            <div className="text-center">
              <div className="flex flex-col pt-2 mx-4">
                <label className="text-gray-600 font-semibold tracking-wide block w-32">
                  High Ending Balance
                </label>
                <span className={'text-2xl font-bold text-gray-700'}>
                  {numFormat('.2%')(
                    portfolioStats.numHighEndBalance /
                      (portfolioStats.numFailures + portfolioStats.numSuccesses)
                  )}
                </span>
                <span className="text-gray-600 text-sm mt-1">
                  {portfolioStats.numHighEndBalance} out of{' '}
                  {portfolioStats.numFailures + portfolioStats.numSuccesses}
                </span>
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
                <th
                  colSpan={3}
                  className="text-center text-gray-700 bg-gray-300 font-semibold"
                  style={{ width: '14rem' }}
                >
                  Portfolio Stats
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
                  <label className="form-label mx-10 my-0 font-normal block">
                    Minimum
                  </label>
                </td>
                <td className="text-right pr-4">
                  {portfolioStats.balance.min.balanceInflAdj < 0
                    ? numToCurrency(0)
                    : numToCurrency(
                        portfolioStats.balance.min.balanceInflAdj,
                        0
                      )}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label mx-10 my-0 font-normal block">
                    Average
                  </label>
                </td>
                <td className="text-right pr-4">
                  {numToCurrency(portfolioStats.balance.averageInflAdj, 0)}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label mx-10 my-0 font-normal block">
                    Maximum
                  </label>
                </td>
                <td className="text-right pr-4">
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
                  <label className="form-label mx-10 my-0 font-normal block">
                    Minimum
                  </label>
                </td>
                <td className="text-right pr-4">
                  {numToCurrency(
                    portfolioStats.withdrawals.min.amountInflAdj,
                    0
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label mx-10 my-0 font-normal block">
                    Average
                  </label>
                </td>
                <td className="text-right pr-4">
                  {numToCurrency(portfolioStats.withdrawals.averageInflAdj, 0)}
                </td>
              </tr>
              <tr>
                <td>
                  <label className="form-label mx-10 my-0 font-normal block">
                    Maximum
                  </label>
                </td>
                <td className="text-right pr-4">
                  {numToCurrency(
                    portfolioStats.withdrawals.max.amountInflAdj,
                    0
                  )}
                </td>
              </tr>
              <tr>
                <td colSpan={4}>
                  <div className="my-2 pr-4"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="ml-6">
        {!selectedPoint ? null : (
          <div className="rounded-md overflow-hidden border-2 m-6">
            <table className="border-collapse">
              <thead>
                <tr className="bg-green-500 text-white">
                  <th className="p-2">Year</th>
                  <th className="p-2">Ending Balance</th>
                  <th className="p-2">Withdrawal</th>
                </tr>
              </thead>
              <tbody>
                {lifecyclesData[selectedPoint.cycleIndex].map((yearData, i) => (
                  <tr
                    key={i + 1}
                    className="group transition-colors even:bg-gray-200 cursor-pointer"
                    onClick={() =>
                      setSelectedPoint({
                        cycleIndex: selectedPoint.cycleIndex,
                        yearIndex: i
                      })
                    }
                  >
                    <td
                      className={
                        'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                        (selectedPoint.yearIndex === i ? ' bg-green-200' : '')
                      }
                    >
                      {yearData.cycleYear}
                    </td>
                    <td
                      className={
                        'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                        (selectedPoint.yearIndex === i ? ' bg-green-200' : '')
                      }
                    >
                      {numFormat('$,.2f')(yearData.balanceInfAdjEnd)}
                    </td>
                    <td
                      className={
                        'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                        (selectedPoint.yearIndex === i ? ' bg-green-200' : '')
                      }
                    >
                      {numFormat('$,.2f')(yearData.withdrawalInfAdjust)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
