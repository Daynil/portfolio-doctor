import React from 'react';
import { CycleYearData } from '../../data/calc/portfolio-calc';
import { numToCurrency } from '../../utilities/format';

type Props = {
  width: number;
  yearData: CycleYearData;
  cycleLength: number;
  pointFixed: boolean;
  leftAdjust: number;
};

export function HistoricCyclesTooltip({
  width,
  yearData,
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
      <div className="flex justify-between mt-2">
        <label className="form-label my-0">Balance</label>
        <span>{numToCurrency(yearData.balanceInfAdjEnd, 0)}</span>
      </div>
      <div className="flex justify-between">
        <label className="form-label my-0">Withdrawal</label>
        <span>{numToCurrency(yearData.withdrawalInfAdjust, 0)}</span>
      </div>
      <div className="text-gray-500 text-sm text-center mt-2 font-semibold">
        Click to {pointFixed ? 'release' : 'freeze'} point
      </div>
    </div>
  );
}
