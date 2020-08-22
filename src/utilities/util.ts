import { parse, stringify } from 'query-string';
import {
  CycleYearData,
  PortfolioOptions,
  SimulationMethod,
  WithdrawalMethod
} from '../data/calc/portfolio-calc';

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

export interface UrlQuery {
  simulationMethod: string;
  startBalance: string;
  equitiesRatio: string;
  investmentExpenseRatio: string;
  withdrawalMethod: string;
  withdrawalStaticAmount?: string;
  withdrawalPercent?: string;
  withdrawalFloor?: string;
  withdrawalCeiling?: string;
  simulationYearsLength: string;
}

export const defaultPortfolioOptions: PortfolioOptions = {
  simulationMethod: 'Historical Data',
  startBalance: 1000000,
  equitiesRatio: 0.9,
  investmentExpenseRatio: 0.0025,
  withdrawalMethod: 1,
  withdrawal: {
    staticAmount: 40000,
    percentage: 0.04,
    floor: 30000,
    ceiling: 60000
  },
  simulationYearsLength: 60
};

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

export function queryStringToPortfolioOptions(
  queryString: string
): [PortfolioOptions, boolean] {
  const query = (parse(queryString) as unknown) as UrlQuery;
  let options = { ...defaultPortfolioOptions };
  let validatedOptionPresent = false;

  options.simulationMethod = query.simulationMethod as SimulationMethod;
  options.startBalance = parseInt(query.startBalance);
  options.equitiesRatio = parseFloat(query.equitiesRatio);
  options.investmentExpenseRatio = parseFloat(query.investmentExpenseRatio);
  options.simulationYearsLength = parseInt(query.simulationYearsLength);
  options.withdrawalMethod = parseInt(
    query.withdrawalMethod
  ) as WithdrawalMethod;

  if (options.withdrawalMethod === WithdrawalMethod.InflationAdjusted) {
    options.withdrawal.staticAmount = parseInt(query.withdrawalStaticAmount);
  } else {
    options.withdrawal.percentage = parseFloat(query.withdrawalPercent);
  }

  if (options.withdrawalMethod === WithdrawalMethod.PercentPortfolioClamped) {
    options.withdrawal.floor = parseInt(query.withdrawalFloor);
    options.withdrawal.ceiling = parseInt(query.withdrawalCeiling);
  }

  // Check if we have any valid options parsed from query, else reset them to default
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      if (isNaN(options[key]) || typeof options[key] === 'undefined') {
        options[key] = defaultPortfolioOptions[key];
      } else {
        validatedOptionPresent = true;
      }
    }
  }

  if (options.withdrawalMethod !== WithdrawalMethod.InflationAdjusted) {
    for (const key in options.withdrawal) {
      if (options.withdrawal.hasOwnProperty(key)) {
        if (isNaN(options.withdrawal[key])) {
          options.withdrawal[key] = defaultPortfolioOptions.withdrawal[key];
        } else {
          validatedOptionPresent = true;
        }
      }
    }
  }

  if (validatedOptionPresent) return [options, true];
  else return [defaultPortfolioOptions, false];
}

export function portfolioOptionsToQueryString(
  options: PortfolioOptions
): string {
  const queryObj: UrlQuery = {
    simulationMethod: options.simulationMethod,
    startBalance: options.startBalance + '',
    equitiesRatio: options.equitiesRatio + '',
    investmentExpenseRatio: options.investmentExpenseRatio + '',
    withdrawalMethod: options.withdrawalMethod + '',
    simulationYearsLength: options.simulationYearsLength + ''
  };

  if (options.withdrawalMethod === WithdrawalMethod.InflationAdjusted) {
    queryObj.withdrawalStaticAmount = options.withdrawal.staticAmount + '';
  } else {
    queryObj.withdrawalPercent = options.withdrawal.percentage + '';
  }

  if (options.withdrawalMethod === WithdrawalMethod.PercentPortfolioClamped) {
    queryObj.withdrawalFloor = options.withdrawal.floor + '';
    queryObj.withdrawalCeiling = options.withdrawal.ceiling + '';
  }

  return stringify(queryObj);
}
