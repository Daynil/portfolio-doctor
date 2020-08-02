// import { CycleData } from '../data/calc/portfolio-calc';

import { CycleYearData } from '../data/calc/portfolio-calc';

export interface DataColumns {
  cycleYear: number[];
  cycleStartYear: number[];
  cumulativeInflation: number[];
  balanceStart: number[];
  balanceInfAdjStart: number[];
  withdrawal: number[];
  withdrawalInfAdjust: number[];
  startSubtotal: number[];
  equities: number[];
  equitiesGrowth: number[];
  dividendsGrowth: number[];
  bonds: number[];
  bondsGrowth: number[];
  endSubtotal: number[];
  fees: number[];
  balanceEnd: number[];
  balanceInfAdjEnd: number[];
}

/**
 * Create an object with an array of each column across all years for each cycle year
 * i.e. Condenses each cycle's array of cycleYear rows into 1 aggregate row per cycle
 * Used for cycle-level statistics
 */
export function pivotPortfolioCycles(
  portfolioLifecyclesData: CycleYearData[][]
): DataColumns[] {
  const portfolioYearDataColumns: DataColumns[] = [];
  portfolioLifecyclesData.map((cycleData) => {
    const yearDataColumns: DataColumns = {
      cycleYear: [],
      cycleStartYear: [],
      cumulativeInflation: [],
      balanceStart: [],
      balanceInfAdjStart: [],
      withdrawal: [],
      withdrawalInfAdjust: [],
      startSubtotal: [],
      equities: [],
      equitiesGrowth: [],
      dividendsGrowth: [],
      bonds: [],
      bondsGrowth: [],
      endSubtotal: [],
      fees: [],
      balanceEnd: [],
      balanceInfAdjEnd: []
    };
    cycleData.map((yearData) => {
      for (const key in yearData) {
        if (yearData.hasOwnProperty(key)) {
          (yearDataColumns[key] as number[]).push(yearData[key]);
        }
      }
    });
    portfolioYearDataColumns.push(yearDataColumns);
  });
  return portfolioYearDataColumns;
}

/**
 * Create an object with an array of each column across all years of all cycle years
 * i.e. Condenses each cycle's array of cycleYear rows into 1 aggregate row for all cycles
 * Used to obtain cycle-level statistics of portfolio statistics and portfolio-level averages (average of averages not as accurate)
 * (e.g. maximum individual withdrawal amount year across all cycles)
 */
export function pivotPortfolioCyclesAggregate(
  portfolioLifecyclesData: CycleYearData[][]
): DataColumns {
  const portfolioCycleDataColumns: DataColumns = {
    cycleYear: [],
    cycleStartYear: [],
    cumulativeInflation: [],
    balanceStart: [],
    balanceInfAdjStart: [],
    withdrawal: [],
    withdrawalInfAdjust: [],
    startSubtotal: [],
    equities: [],
    equitiesGrowth: [],
    dividendsGrowth: [],
    bonds: [],
    bondsGrowth: [],
    endSubtotal: [],
    fees: [],
    balanceEnd: [],
    balanceInfAdjEnd: []
  };
  portfolioLifecyclesData.map((cycleData) => {
    cycleData.map((yearData) => {
      for (const key in yearData) {
        if (yearData.hasOwnProperty(key)) {
          (portfolioCycleDataColumns[key] as number[]).push(yearData[key]);
        }
      }
    });
  });
  return portfolioCycleDataColumns;
}
