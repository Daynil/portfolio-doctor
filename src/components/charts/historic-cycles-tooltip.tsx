import React from 'react';
import { CycleStats, CycleYearData } from '../../data/calc/portfolio-calc';
import { numToCurrency } from '../../utilities/format';
import { colors } from './historic-cycles-chart';

type Props = {
  width: number;
  cycleStats: CycleStats;
  yearData: CycleYearData;
  cycleLength: number;
  pointFixed: boolean;
  leftAdjust: number;
  adjInflation: boolean;
};

export function HistoricCyclesTooltip({
  width,
  cycleStats,
  yearData,
  pointFixed,
  cycleLength,
  leftAdjust,
  adjInflation
}: Props) {
  return (
    <div
      style={{
        width: `${width}px`,
        height: '20rem',
        top: '26px',
        left: `${leftAdjust}px`
      }}
      className="absolute inset-y-0 inset-x-0 pointer-events-none bg-gray-100 rounded-md p-4 shadow-md"
    >
      <div className="flex justify-evenly">
        <div className="flex flex-col">
          <label className="form-label my-0">Start Year</label>
          <span>{yearData.cycleStartYear}</span>
        </div>
        <div className="flex flex-col">
          <label className="form-label my-0">Current Year</label>
          <span>{yearData.cycleYear}</span>
        </div>
        <div className="flex flex-col">
          <label className="form-label my-0">End Year</label>
          <span>{yearData.cycleStartYear + cycleLength}</span>
        </div>
      </div>
      <div className="my-3 bg-gray-400 w-full h-px"></div>
      <div className="flex items-center">
        <div className="text-gray-500 font-semibold text-base mr-6">Year</div>
        <div className="flex flex-col w-full">
          <div className="flex justify-between mt-2">
            <div className="flex items-center">
              <label className="form-label my-0">Balance</label>
            </div>
            <span>
              {numToCurrency(
                adjInflation ? yearData.balanceInfAdjEnd : yearData.balanceEnd,
                0
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <label className="form-label my-0">Withdrawal</label>
            </div>
            <span>
              {numToCurrency(
                adjInflation
                  ? yearData.withdrawalInfAdjust
                  : yearData.withdrawal,
                0
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="my-3 bg-gray-400 w-full h-px"></div>
      <div className="flex items-center">
        <div className="text-gray-500 font-semibold text-base mr-6">Cycle</div>
        <div className="flex flex-col w-full">
          <div className="flex justify-between mt-2">
            <div className="flex items-center">
              <label className="form-label my-0">Ending Balance</label>
            </div>
            <span>
              {numToCurrency(
                adjInflation
                  ? cycleStats.balance.endingInflAdj
                  : cycleStats.balance.ending,
                0
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <label className="form-label my-0">Avg Balance</label>
            </div>
            <span>
              {numToCurrency(
                adjInflation
                  ? cycleStats.balance.averageInflAdj
                  : cycleStats.balance.average,
                0
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <label className="form-label my-0">Avg Withdrawal</label>
            </div>
            <span>
              {numToCurrency(
                adjInflation
                  ? cycleStats.withdrawals.averageInflAdj
                  : cycleStats.withdrawals.average,
                0
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="text-gray-500 text-sm text-center mt-4 font-semibold">
        Click to{' '}
        <span style={{ color: colors.green.dark }} className="underline">
          {pointFixed ? 'release' : 'freeze'}
        </span>{' '}
        point
      </div>
    </div>
  );
}
