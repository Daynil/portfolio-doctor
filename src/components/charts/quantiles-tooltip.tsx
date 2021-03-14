import React from 'react';
import {
  CycleYearQuantile,
  QuantileStats
} from '../../data/calc/portfolio-calc';
import { numToCurrency } from '../../utilities/format';
import { colors } from './historic-cycles-chart';

type Props = {
  width: number;
  quantile: CycleYearQuantile;
  quantileStats: QuantileStats;
  cycleLength: number;
  pointFixed: boolean;
  leftAdjust: number;
  adjInflation: boolean;
};

export function QuantilesTooltip({
  width,
  quantile,
  quantileStats,
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
          <label className="form-label my-0">Percentile</label>
          <span>{quantile.quantile * 100}th</span>
        </div>
        <div className="flex flex-col">
          <label className="form-label my-0">Current Year</label>
          <span>{quantile.cycleYearIndex + 1}</span>
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
                adjInflation ? quantile.balanceInfAdj : quantile.balance,
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
                adjInflation ? quantile.withdrawalInfAdj : quantile.withdrawal,
                0
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="my-3 bg-gray-400 w-full h-px"></div>
      <div className="flex items-center">
        <div className="text-gray-500 font-semibold text-base mr-6">%ile</div>
        <div className="flex flex-col w-full">
          <div className="flex justify-between mt-2">
            <div className="flex items-center">
              <label className="form-label my-0">Ending Balance</label>
            </div>
            <span>
              {numToCurrency(
                adjInflation
                  ? quantileStats.endingBalanceInfAdj
                  : quantileStats.endingBalance,
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
                  ? quantileStats.averageBalanceInfAdj
                  : quantileStats.averageBalance,
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
                  ? quantileStats.averageWithdrawalInfAdj
                  : quantileStats.averageWithdrawal,
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
