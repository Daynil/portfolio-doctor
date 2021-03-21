import { format as numFormat } from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import {
  CycleStats,
  CycleYearData,
  CycleYearQuantile,
  MarketYearData,
  PortfolioOptions,
  PortfolioStats,
  QuantileStats
} from '../data/calc/portfolio-calc';
import { baseUrl } from '../utilities/constants';
import { numToCurrency } from '../utilities/format';
import { clsx, portfolioOptionsToQueryString } from '../utilities/util';
import { HistoricCyclesChart } from './charts/historic-cycles-chart';
import { QuantilesChart } from './charts/quantiles-chart';
import CopyIcon from './svg/copy-icon';
import ShareIcon from './svg/share-icon';
import TextLink from './text-link';

export interface PortfolioData {
  lifecyclesData: CycleYearData[][];
  lifecyclesStats: CycleStats[];
  portfolioStats: PortfolioStats;
  quantiles: CycleYearQuantile[][];
  quantileStats: QuantileStats[];
  options: PortfolioOptions;
  marketData: MarketYearData[];
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
  quantileStats,
  options,
  marketData
}: PortfolioData) {
  const refCopyURL = useRef<HTMLInputElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<Point>(null);
  const [pointFixed, setPointFixed] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('Full');
  const [adjInflation, setAdjInflation] = useState(true);

  const [zoomView, setZoomView] = useState(false);
  const [unzoomedCycleIndex, setUnzoomedCycleIndex] = useState(0);
  const [zoomedYearIndex, setZoomedYearIndex] = useState(0);

  const [showCycleDetails, setShowCycleDetails] = useState(false);

  const [copyComplete, setCopyComplete] = useState(false);
  const [copyModalActive, setCopyModalActive] = useState(false);

  useEffect(() => {
    setZoomView(false);
    setUnzoomedCycleIndex(0);
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

  function handleDisplayModeSwitch(newDisplayMode: DisplayMode) {
    if (newDisplayMode === 'Full' && zoomView) {
      // We can only leave zoom view to here, so reset cached cycle index
      setZoomView(false);
      if (pointFixed) {
        setSelectedPoint({
          cycleIndex: unzoomedCycleIndex,
          yearIndex: zoomedYearIndex
        });
      }
    } else {
      // We're leaving to/from quantiles, reset both
      setPointFixed(null);
      setSelectedPoint(null);
      setZoomView(false);
    }
    setDisplayMode(newDisplayMode);
  }

  function getZoomButtonDisabled() {
    if (zoomView) return false;
    return !(selectedPoint && pointFixed && displayMode === 'Full');
  }

  function toggleZoomView() {
    // Cache this so we can retrieve it again when we unzoom again
    setUnzoomedCycleIndex(selectedPoint.cycleIndex);
    setZoomedYearIndex(selectedPoint.yearIndex);
    setZoomView(true);
  }

  function setSelectedZoomPoint(point: Point) {
    if (!point) {
      setSelectedPoint(null);
      setZoomedYearIndex(null);
    } else {
      setZoomedYearIndex(point.yearIndex);
    }
  }

  function getYearMarketInfo(cycleYear: number): MarketYearData {
    return marketData.find((d) => d.year === cycleYear);
  }

  function chartView() {
    if (displayMode === 'Full' && !zoomView) {
      return (
        <HistoricCyclesChart
          dataSeries={lifecyclesData}
          allLineMeta={lifecyclesStats}
          aspectRatio={1000 / 600}
          selectedPoint={selectedPoint}
          handleSetSelectedPoint={(point: Point) => setSelectedPoint(point)}
          pointFixed={pointFixed}
          handleSetPointFixed={(fixed: boolean) => setPointFixed(fixed)}
          adjInflation={adjInflation}
        />
      );
    } else if (displayMode === 'Full' && zoomView) {
      return (
        <HistoricCyclesChart
          dataSeries={[lifecyclesData[unzoomedCycleIndex]]}
          allLineMeta={[lifecyclesStats[unzoomedCycleIndex]]}
          aspectRatio={1000 / 600}
          selectedPoint={
            zoomedYearIndex === 0 || zoomedYearIndex
              ? { cycleIndex: 0, yearIndex: zoomedYearIndex }
              : null
          }
          handleSetSelectedPoint={(point: Point) => setSelectedZoomPoint(point)}
          pointFixed={pointFixed}
          handleSetPointFixed={(fixed: boolean) => setPointFixed(fixed)}
          adjInflation={adjInflation}
        />
      );
    } else {
      return (
        <QuantilesChart
          dataSeries={quantiles}
          allLineMeta={quantileStats}
          aspectRatio={1000 / 600}
          selectedPoint={selectedPoint}
          handleSetSelectedPoint={(point: Point) => setSelectedPoint(point)}
          pointFixed={pointFixed}
          handleSetPointFixed={(fixed: boolean) => setPointFixed(fixed)}
          adjInflation={adjInflation}
        />
      );
    }
  }

  function cycleDetailsTitle() {
    if (displayMode === 'Full' && !zoomView) {
      if (!selectedPoint) return 'Cycle Details';
      const selectedCycleStart =
        lifecyclesData[selectedPoint.cycleIndex][0].cycleStartYear;
      return `Cycle Starting ${selectedCycleStart} Details`;
    } else if (displayMode === 'Full' && zoomView) {
      return `Cycle Starting ${lifecyclesData[unzoomedCycleIndex][0].cycleStartYear} Details`;
    } else {
      if (!selectedPoint) return 'Quantile Details';
      const selectedQuantile =
        quantiles[selectedPoint.cycleIndex][0].quantile * 100;
      return `${selectedQuantile}th Percentile Quantile Details`;
    }
  }

  function getTableBody() {
    let shouldShowDetails = false;
    if (!zoomView && selectedPoint) shouldShowDetails = true;
    if (zoomView) shouldShowDetails = true;
    return !shouldShowDetails ? (
      <tbody>
        <tr>
          <td colSpan={3} className="text-center py-2 text-base text-gray-500">
            {cycleDetailsEmptyBody()}
          </td>
        </tr>
      </tbody>
    ) : (
      cycleDetailsBody()
    );
  }

  function cycleDetailsEmptyBody() {
    if (displayMode === 'Full') {
      return (
        <div className="px-4">
          <div>Select a cycle by clicking in the chart above to view data</div>
          <div className="mt-2">
            <label htmlFor="cycleStartYear" className="mr-2">
              Or, select the cycle starting in year:
            </label>
            <select
              id="cycleStartYear"
              className="rounded-md shadow-sm bg-gray-100 border-gray-300 transition-colors duration-75 hover:border-green-300 focus:bg-transparent focus:border-green-400 focus:ring focus:ring-green-300 focus:ring-opacity-50"
              onChange={(e) => {
                if (e.target.value === '') return;
                const selectedYear = parseInt(e.target.value);
                setSelectedPoint({
                  cycleIndex: selectedYear - marketData[0].year,
                  yearIndex: 0
                });
                setPointFixed(true);
              }}
            >
              <option value=""></option>
              {marketData.map((yearData) => (
                <option key={yearData.year} value={yearData.year}>
                  {yearData.event
                    ? `${yearData.year} - ${yearData.event}`
                    : yearData.year}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    } else {
      return (
        <span className="px-4">
          Select a quantile by clicking in the chart above to view details
        </span>
      );
    }
  }

  function cycleDetailsBody() {
    const allCyclesRows = lifecyclesData[unzoomedCycleIndex].map(
      (yearData, i) => {
        const marketYearInfo = getYearMarketInfo(yearData.cycleYear);
        const rowSelected = !zoomView
          ? selectedPoint.yearIndex === i
          : zoomedYearIndex === i;
        return (
          <tr
            key={i + 1}
            className="group transition-colors even:bg-gray-200 cursor-pointer"
            onClick={() => {
              if (!zoomView) {
                setSelectedPoint({
                  cycleIndex: selectedPoint.cycleIndex,
                  yearIndex: i
                });
              } else {
                setZoomedYearIndex(i);
              }
            }}
          >
            <td
              className={
                'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                (rowSelected ? ' bg-green-200' : '')
              }
            >
              {yearData.cycleYear}
            </td>
            <td
              className={
                'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                (rowSelected ? ' bg-green-200' : '')
              }
            >
              {numFormat('$,.2f')(
                adjInflation ? yearData.balanceInfAdjEnd : yearData.balanceEnd
              )}
            </td>
            <td
              className={
                'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                (rowSelected ? ' bg-green-200' : '')
              }
            >
              {numFormat('$,.2f')(
                adjInflation
                  ? yearData.withdrawalInfAdjust
                  : yearData.withdrawal
              )}
            </td>
            <td
              className={
                'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                (rowSelected ? ' bg-green-200' : '')
              }
            >
              {numFormat('$,.2f')(
                adjInflation ? yearData.depositInfAdjust : yearData.deposit
              )}
            </td>
            <td
              className={
                'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                (rowSelected ? ' bg-green-200' : '')
              }
            >
              <TextLink href={marketYearInfo.eventLink}>
                {marketYearInfo.event}
              </TextLink>
            </td>
          </tr>
        );
      }
    );

    const quantilesRows =
      displayMode === 'Full'
        ? null
        : quantiles[selectedPoint.cycleIndex].map((quantileData, i) => (
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
                {quantileData.cycleYearIndex + 1}
              </td>
              <td
                className={
                  'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                  (selectedPoint.yearIndex === i ? ' bg-green-200' : '')
                }
              >
                {numFormat('$,.2f')(quantileData.balance)}
              </td>
              <td
                className={
                  'group-hover:bg-green-200 duration-200 text-right py-2 px-6' +
                  (selectedPoint.yearIndex === i ? ' bg-green-200' : '')
                }
              >
                {numFormat('$,.2f')(quantileData.withdrawal)}
              </td>
            </tr>
          ));

    return (
      <tbody>{displayMode === 'Full' ? allCyclesRows : quantilesRows}</tbody>
    );
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
          <div className="flex flex-row">
            <button
              className={clsx(
                'btn',
                displayMode === 'Full' && !zoomView ? 'btn-green-2' : 'btn-gray'
              )}
              onClick={() => handleDisplayModeSwitch('Full')}
            >
              All Cycles
            </button>
            <button
              className={clsx(
                'btn ml-6',
                displayMode === 'Full' && zoomView ? 'btn-green-2' : 'btn-gray'
              )}
              disabled={getZoomButtonDisabled()}
              onClick={() => toggleZoomView()}
            >
              Zoom Cycle
            </button>
            <button
              className={clsx(
                'btn ml-6',
                displayMode === 'Full' ? 'btn-gray' : 'btn-green-2'
              )}
              onClick={() => handleDisplayModeSwitch('Quantiles')}
            >
              Quantiles
            </button>
            <div className="flex flex-row items-center ml-6">
              <input
                type="checkbox"
                id="adjInflation"
                className="text-green-500 focus:ring-green-400"
                checked={adjInflation}
                onChange={() => setAdjInflation(!adjInflation)}
              />
              <label htmlFor="adjInflation" className="ml-2 text-sm">
                Display Inflation Adjusted Values
              </label>
            </div>
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
          <div className="text-sm text-gray-500 mt-10 -mb-7 ml-16">
            {`Portfolio (${adjInflation ? 'Inflation-Adjusted' : 'Nominal'} $)`}
          </div>
          {chartView()}
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
                        adjInflation
                          ? portfolioStats.balance.min.balanceInflAdj
                          : portfolioStats.balance.min.balance,
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
                  {numToCurrency(
                    adjInflation
                      ? portfolioStats.balance.averageInflAdj
                      : portfolioStats.balance.average,
                    0
                  )}
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
                    adjInflation
                      ? portfolioStats.balance.max.balanceInflAdj
                      : portfolioStats.balance.max.balance,
                    0
                  )}
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
                    adjInflation
                      ? portfolioStats.withdrawals.min.amountInflAdj
                      : portfolioStats.withdrawals.min.amount,
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
                  {numToCurrency(
                    adjInflation
                      ? portfolioStats.withdrawals.averageInflAdj
                      : portfolioStats.withdrawals.average,
                    0
                  )}
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
                    adjInflation
                      ? portfolioStats.withdrawals.max.amountInflAdj
                      : portfolioStats.withdrawals.max.amount,
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
        <div className="m-6">
          <div className="font-bold bg-gray-300 text-gray-700 w-full text-center rounded-t-md py-2">
            {cycleDetailsTitle()}
          </div>
          <div className="rounded-b-md overflow-hidden border-2">
            <table className="border-collapse">
              <thead>
                <tr className="bg-green-500 text-white">
                  <th className="p-2">Year</th>
                  <th className="p-2">Ending Balance</th>
                  <th className="p-2">Withdrawal</th>
                  {displayMode === 'Full' && <th className="p-2">Deposit</th>}
                  {displayMode === 'Full' && (
                    <th className="p-2">Notable Events</th>
                  )}
                </tr>
              </thead>
              {getTableBody()}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
