import React from 'react';
import { CycleYearQuantile } from '../../data/calc/portfolio-calc';
import { numToCurrency } from '../../utilities/format';
import { colors } from './historic-cycles-chart';

type Props = {
  width: number;
  quantile: CycleYearQuantile;
  cycleLength: number;
  pointFixed: boolean;
  leftAdjust: number;
};

export function MonteCarloQuantilesTooltip({
  width,
  quantile,
  pointFixed,
  cycleLength,
  leftAdjust
}: Props) {
  return (
    <div
      style={{
        width: `${width}px`,
        height: '11rem',
        top: '26px',
        left: `${leftAdjust}px`
      }}
      className="absolute inset-y-0 inset-x-0 pointer-events-none bg-gray-100 rounded-md p-4 shadow-md"
    >
      <div className="flex flex-col justify-evenly">
        <div className="flex flex-row justify-evenly">
          <div className="flex flex-col items-center">
            <label className="form-label my-0">Percentile</label>
            <span className="ml-2">{quantile.quantile * 100}th</span>
          </div>
          <div className="flex flex-col items-center">
            <label className="form-label my-0">Current Year</label>
            <span className="ml-2">{quantile.cycleYearIndex + 1}</span>
          </div>
        </div>
        <div className="my-3 bg-gray-400 w-full h-px"></div>
        <div className="flex justify-evenly mt-2">
          <label className="form-label my-0">Balance</label>
          <span>{numToCurrency(quantile.balance, 0)}</span>
        </div>
        <div className="text-gray-500 text-sm text-center mt-4 font-semibold">
          Click to{' '}
          <span style={{ color: colors.green.dark }}>
            {pointFixed ? 'release' : 'freeze'}
          </span>{' '}
          point
        </div>
      </div>
    </div>
  );
}
