import { readFileSync } from 'fs';
import { round } from '../../utilities/math';
import {
  DataColumns,
  pivotPortfolioCycles,
  pivotPortfolioCyclesAggregate
} from '../../utilities/util';
import * as dataHelpers from '../data-helpers';
import {
  CyclePortfolio,
  CycleYearData,
  generateMonteCarloRuns,
  getMaxSimulationLength,
  getYearIndex,
  MarketYearData,
  PortfolioOptions,
  PortfolioStats,
  WithdrawalMethod
} from './portfolio-calc';

// Test expectations from "Portfolio Doctor Simulator.xlsm"

const minimalOptions: PortfolioOptions = {
  simulationMethod: 'Historical Data',
  investmentExpenseRatio: 1,
  equitiesRatio: 1,
  simulationYearsLength: 1,
  startBalance: 1,
  withdrawalMethod: WithdrawalMethod.Nominal,
  withdrawal: { staticAmount: 1 }
};

const starterOptions: PortfolioOptions = {
  simulationMethod: 'Historical Data',
  startBalance: 1000000,
  equitiesRatio: 0.9,
  investmentExpenseRatio: 0.0025,
  simulationYearsLength: 60,
  withdrawalMethod: WithdrawalMethod.Nominal,
  withdrawal: { staticAmount: 40000 }
};

let fullMarketYearData: MarketYearData[];

beforeAll(async () => {
  const csvString = readFileSync(
    require.resolve('../../../public/jan-shiller-data.csv'),
    {
      encoding: 'utf8'
    }
  );
  fullMarketYearData = dataHelpers.parseCSVStringToJSON(csvString);
});

describe('data slicing tests', () => {
  test('slices data for cycle analytics', () => {
    const results: CycleYearData[][] = [
      [
        {
          cycleYear: 1,
          cycleStartYear: 1,
          cumulativeInflation: 1,
          balanceStart: 1,
          balanceInfAdjStart: 1,
          withdrawal: 1,
          withdrawalInfAdjust: 1,
          startSubtotal: 1,
          equities: 1,
          equitiesGrowth: 1,
          dividendsGrowth: 1,
          bonds: 1,
          bondsGrowth: 1,
          endSubtotal: 1,
          fees: 1,
          balanceEnd: 1,
          balanceInfAdjEnd: 1
        },
        {
          cycleYear: 2,
          cycleStartYear: 2,
          cumulativeInflation: 2,
          balanceStart: 2,
          balanceInfAdjStart: 2,
          withdrawal: 2,
          withdrawalInfAdjust: 2,
          startSubtotal: 2,
          equities: 2,
          equitiesGrowth: 2,
          dividendsGrowth: 2,
          bonds: 2,
          bondsGrowth: 2,
          endSubtotal: 2,
          fees: 2,
          balanceEnd: 2,
          balanceInfAdjEnd: 2
        },
        {
          cycleYear: 3,
          cycleStartYear: 3,
          cumulativeInflation: 3,
          balanceStart: 3,
          balanceInfAdjStart: 3,
          withdrawal: 3,
          withdrawalInfAdjust: 3,
          startSubtotal: 3,
          equities: 3,
          equitiesGrowth: 3,
          dividendsGrowth: 3,
          bonds: 3,
          bondsGrowth: 3,
          endSubtotal: 3,
          fees: 3,
          balanceEnd: 3,
          balanceInfAdjEnd: 3
        }
      ],
      [
        {
          cycleYear: 1,
          cycleStartYear: 1,
          cumulativeInflation: 1,
          balanceStart: 1,
          balanceInfAdjStart: 1,
          withdrawal: 1,
          withdrawalInfAdjust: 1,
          startSubtotal: 1,
          equities: 1,
          equitiesGrowth: 1,
          dividendsGrowth: 1,
          bonds: 1,
          bondsGrowth: 1,
          endSubtotal: 1,
          fees: 1,
          balanceEnd: 1,
          balanceInfAdjEnd: 1
        },
        {
          cycleYear: 2,
          cycleStartYear: 2,
          cumulativeInflation: 2,
          balanceStart: 2,
          balanceInfAdjStart: 2,
          withdrawal: 2,
          withdrawalInfAdjust: 2,
          startSubtotal: 2,
          equities: 2,
          equitiesGrowth: 2,
          dividendsGrowth: 2,
          bonds: 2,
          bondsGrowth: 2,
          endSubtotal: 2,
          fees: 2,
          balanceEnd: 2,
          balanceInfAdjEnd: 2
        },
        {
          cycleYear: 3,
          cycleStartYear: 3,
          cumulativeInflation: 3,
          balanceStart: 3,
          balanceInfAdjStart: 3,
          withdrawal: 3,
          withdrawalInfAdjust: 3,
          startSubtotal: 3,
          equities: 3,
          equitiesGrowth: 3,
          dividendsGrowth: 3,
          bonds: 3,
          bondsGrowth: 3,
          endSubtotal: 3,
          fees: 3,
          balanceEnd: 3,
          balanceInfAdjEnd: 3
        }
      ],
      [
        {
          cycleYear: 1,
          cycleStartYear: 1,
          cumulativeInflation: 1,
          balanceStart: 1,
          balanceInfAdjStart: 1,
          withdrawal: 1,
          withdrawalInfAdjust: 1,
          startSubtotal: 1,
          equities: 1,
          equitiesGrowth: 1,
          dividendsGrowth: 1,
          bonds: 1,
          bondsGrowth: 1,
          endSubtotal: 1,
          fees: 1,
          balanceEnd: 1,
          balanceInfAdjEnd: 1
        },
        {
          cycleYear: 2,
          cycleStartYear: 2,
          cumulativeInflation: 2,
          balanceStart: 2,
          balanceInfAdjStart: 2,
          withdrawal: 2,
          withdrawalInfAdjust: 2,
          startSubtotal: 2,
          equities: 2,
          equitiesGrowth: 2,
          dividendsGrowth: 2,
          bonds: 2,
          bondsGrowth: 2,
          endSubtotal: 2,
          fees: 2,
          balanceEnd: 2,
          balanceInfAdjEnd: 2
        },
        {
          cycleYear: 3,
          cycleStartYear: 3,
          cumulativeInflation: 3,
          balanceStart: 3,
          balanceInfAdjStart: 3,
          withdrawal: 3,
          withdrawalInfAdjust: 3,
          startSubtotal: 3,
          equities: 3,
          equitiesGrowth: 3,
          dividendsGrowth: 3,
          bonds: 3,
          bondsGrowth: 3,
          endSubtotal: 3,
          fees: 3,
          balanceEnd: 3,
          balanceInfAdjEnd: 3
        }
      ]
    ];

    const expected: DataColumns[] = [
      {
        cycleYear: [1, 2, 3],
        cycleStartYear: [1, 2, 3],
        cumulativeInflation: [1, 2, 3],
        balanceStart: [1, 2, 3],
        balanceInfAdjStart: [1, 2, 3],
        withdrawal: [1, 2, 3],
        withdrawalInfAdjust: [1, 2, 3],
        startSubtotal: [1, 2, 3],
        equities: [1, 2, 3],
        equitiesGrowth: [1, 2, 3],
        dividendsGrowth: [1, 2, 3],
        bonds: [1, 2, 3],
        bondsGrowth: [1, 2, 3],
        endSubtotal: [1, 2, 3],
        fees: [1, 2, 3],
        balanceEnd: [1, 2, 3],
        balanceInfAdjEnd: [1, 2, 3]
      },
      {
        cycleYear: [1, 2, 3],
        cycleStartYear: [1, 2, 3],
        cumulativeInflation: [1, 2, 3],
        balanceStart: [1, 2, 3],
        balanceInfAdjStart: [1, 2, 3],
        withdrawal: [1, 2, 3],
        withdrawalInfAdjust: [1, 2, 3],
        startSubtotal: [1, 2, 3],
        equities: [1, 2, 3],
        equitiesGrowth: [1, 2, 3],
        dividendsGrowth: [1, 2, 3],
        bonds: [1, 2, 3],
        bondsGrowth: [1, 2, 3],
        endSubtotal: [1, 2, 3],
        fees: [1, 2, 3],
        balanceEnd: [1, 2, 3],
        balanceInfAdjEnd: [1, 2, 3]
      },
      {
        cycleYear: [1, 2, 3],
        cycleStartYear: [1, 2, 3],
        cumulativeInflation: [1, 2, 3],
        balanceStart: [1, 2, 3],
        balanceInfAdjStart: [1, 2, 3],
        withdrawal: [1, 2, 3],
        withdrawalInfAdjust: [1, 2, 3],
        startSubtotal: [1, 2, 3],
        equities: [1, 2, 3],
        equitiesGrowth: [1, 2, 3],
        dividendsGrowth: [1, 2, 3],
        bonds: [1, 2, 3],
        bondsGrowth: [1, 2, 3],
        endSubtotal: [1, 2, 3],
        fees: [1, 2, 3],
        balanceEnd: [1, 2, 3],
        balanceInfAdjEnd: [1, 2, 3]
      }
    ];

    expect(pivotPortfolioCycles(results)).toEqual(expected);
  });

  test('slices data for portfolio analytics', () => {
    const results: CycleYearData[][] = [
      [
        {
          cycleYear: 1,
          cycleStartYear: 1,
          cumulativeInflation: 1,
          balanceStart: 1,
          balanceInfAdjStart: 1,
          withdrawal: 1,
          withdrawalInfAdjust: 1,
          startSubtotal: 1,
          equities: 1,
          equitiesGrowth: 1,
          dividendsGrowth: 1,
          bonds: 1,
          bondsGrowth: 1,
          endSubtotal: 1,
          fees: 1,
          balanceEnd: 1,
          balanceInfAdjEnd: 1
        },
        {
          cycleYear: 2,
          cycleStartYear: 2,
          cumulativeInflation: 2,
          balanceStart: 2,
          balanceInfAdjStart: 2,
          withdrawal: 2,
          withdrawalInfAdjust: 2,
          startSubtotal: 2,
          equities: 2,
          equitiesGrowth: 2,
          dividendsGrowth: 2,
          bonds: 2,
          bondsGrowth: 2,
          endSubtotal: 2,
          fees: 2,
          balanceEnd: 2,
          balanceInfAdjEnd: 2
        },
        {
          cycleYear: 3,
          cycleStartYear: 3,
          cumulativeInflation: 3,
          balanceStart: 3,
          balanceInfAdjStart: 3,
          withdrawal: 3,
          withdrawalInfAdjust: 3,
          startSubtotal: 3,
          equities: 3,
          equitiesGrowth: 3,
          dividendsGrowth: 3,
          bonds: 3,
          bondsGrowth: 3,
          endSubtotal: 3,
          fees: 3,
          balanceEnd: 3,
          balanceInfAdjEnd: 3
        }
      ],
      [
        {
          cycleYear: 1,
          cycleStartYear: 1,
          cumulativeInflation: 1,
          balanceStart: 1,
          balanceInfAdjStart: 1,
          withdrawal: 1,
          withdrawalInfAdjust: 1,
          startSubtotal: 1,
          equities: 1,
          equitiesGrowth: 1,
          dividendsGrowth: 1,
          bonds: 1,
          bondsGrowth: 1,
          endSubtotal: 1,
          fees: 1,
          balanceEnd: 1,
          balanceInfAdjEnd: 1
        },
        {
          cycleYear: 2,
          cycleStartYear: 2,
          cumulativeInflation: 2,
          balanceStart: 2,
          balanceInfAdjStart: 2,
          withdrawal: 2,
          withdrawalInfAdjust: 2,
          startSubtotal: 2,
          equities: 2,
          equitiesGrowth: 2,
          dividendsGrowth: 2,
          bonds: 2,
          bondsGrowth: 2,
          endSubtotal: 2,
          fees: 2,
          balanceEnd: 2,
          balanceInfAdjEnd: 2
        },
        {
          cycleYear: 3,
          cycleStartYear: 3,
          cumulativeInflation: 3,
          balanceStart: 3,
          balanceInfAdjStart: 3,
          withdrawal: 3,
          withdrawalInfAdjust: 3,
          startSubtotal: 3,
          equities: 3,
          equitiesGrowth: 3,
          dividendsGrowth: 3,
          bonds: 3,
          bondsGrowth: 3,
          endSubtotal: 3,
          fees: 3,
          balanceEnd: 3,
          balanceInfAdjEnd: 3
        }
      ],
      [
        {
          cycleYear: 1,
          cycleStartYear: 1,
          cumulativeInflation: 1,
          balanceStart: 1,
          balanceInfAdjStart: 1,
          withdrawal: 1,
          withdrawalInfAdjust: 1,
          startSubtotal: 1,
          equities: 1,
          equitiesGrowth: 1,
          dividendsGrowth: 1,
          bonds: 1,
          bondsGrowth: 1,
          endSubtotal: 1,
          fees: 1,
          balanceEnd: 1,
          balanceInfAdjEnd: 1
        },
        {
          cycleYear: 2,
          cycleStartYear: 2,
          cumulativeInflation: 2,
          balanceStart: 2,
          balanceInfAdjStart: 2,
          withdrawal: 2,
          withdrawalInfAdjust: 2,
          startSubtotal: 2,
          equities: 2,
          equitiesGrowth: 2,
          dividendsGrowth: 2,
          bonds: 2,
          bondsGrowth: 2,
          endSubtotal: 2,
          fees: 2,
          balanceEnd: 2,
          balanceInfAdjEnd: 2
        },
        {
          cycleYear: 3,
          cycleStartYear: 3,
          cumulativeInflation: 3,
          balanceStart: 3,
          balanceInfAdjStart: 3,
          withdrawal: 3,
          withdrawalInfAdjust: 3,
          startSubtotal: 3,
          equities: 3,
          equitiesGrowth: 3,
          dividendsGrowth: 3,
          bonds: 3,
          bondsGrowth: 3,
          endSubtotal: 3,
          fees: 3,
          balanceEnd: 3,
          balanceInfAdjEnd: 3
        }
      ]
    ];

    const expected: DataColumns = {
      cycleYear: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      cycleStartYear: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      cumulativeInflation: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      balanceStart: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      balanceInfAdjStart: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      withdrawal: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      withdrawalInfAdjust: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      startSubtotal: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      equities: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      equitiesGrowth: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      dividendsGrowth: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      bonds: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      bondsGrowth: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      endSubtotal: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      fees: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      balanceEnd: [1, 2, 3, 1, 2, 3, 1, 2, 3],
      balanceInfAdjEnd: [1, 2, 3, 1, 2, 3, 1, 2, 3]
    };

    expect(pivotPortfolioCyclesAggregate(results)).toEqual(expected);
  });
});

describe('basic functionality test', () => {
  test('gets year index', () => {
    const portfolioDefaultStart = new CyclePortfolio(fullMarketYearData, {
      ...minimalOptions
    });
    const slicedMarket = fullMarketYearData.slice(119, 140);
    const portfolioCustomStart = new CyclePortfolio(slicedMarket, {
      ...minimalOptions
    });

    expect(portfolioDefaultStart.getYearIndex(1871)).toEqual(0);
    expect(portfolioDefaultStart.getYearIndex(1875)).toEqual(4);
    expect(portfolioCustomStart.getYearIndex(2005)).toEqual(15);
    expect(getYearIndex(slicedMarket, 2005)).toEqual(15);
  });

  test('gets max simulation cycles', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );
    const portfolioDefault = new CyclePortfolio(longTestData, {
      ...minimalOptions,
      simulationYearsLength: 3
    });
    const shortTestData = fullMarketYearData.slice(
      getYearIndex(fullMarketYearData, 1990),
      getYearIndex(fullMarketYearData, 2010) + 1
    );
    const portfolioRange = new CyclePortfolio(shortTestData, {
      ...minimalOptions,
      simulationYearsLength: 3
    });

    expect(portfolioDefault.getMaxSimulationCycles()).toEqual(145);
    expect(portfolioRange.getMaxSimulationCycles()).toEqual(18);
  });
});

describe('full 3-cycle portfolio tests against excel data', () => {
  let portfolioStats: PortfolioStats;
  beforeAll(() => {
    const excelStatsTestSlice = fullMarketYearData.slice(
      getYearIndex(fullMarketYearData, 2013),
      getYearIndex(fullMarketYearData, 2018) + 1
    );
    const infAdjPortfolio = new CyclePortfolio(excelStatsTestSlice, {
      ...starterOptions,
      simulationYearsLength: 3,
      withdrawalMethod: WithdrawalMethod.InflationAdjusted
    });
    const results = infAdjPortfolio.crunchAllCyclesData();

    portfolioStats = infAdjPortfolio.crunchAllPortfolioStats(results);
  });

  test('calculates each type of cycle-level statistic correctly', () => {
    const firstCycleStats = portfolioStats.cycleStats[0];

    expect(firstCycleStats.fees).toBeCloseTo(9124.9341, 4);
    expect(firstCycleStats.balance.averageInflAdj).toBeCloseTo(1201199.3865, 4);
    expect(firstCycleStats.withdrawals.median).toBeCloseTo(40595.2753, 4);
    expect(firstCycleStats.balance.ending).toBeCloseTo(1192323.1914, 4);
    expect(firstCycleStats.balance.max.year).toEqual(2014);
    expect(firstCycleStats.withdrawals.min.amountInflAdj).toBeCloseTo(40000, 4);
    expect(firstCycleStats.failureYear).toEqual(0);
  });

  test('calculates each type of portfolio-level statistic correctly', () => {
    expect(portfolioStats.successRate).toEqual(1);
    expect(portfolioStats.investmentExpenses.averageAnnual).toBeCloseTo(
      2807.3571,
      4
    );
    expect(portfolioStats.investmentExpenses.medianTotal).toBeCloseTo(
      8077.9112,
      4
    );
    expect(portfolioStats.equitiesPriceChange.averageAnnual).toBeCloseTo(
      85745.9881,
      4
    );
    expect(portfolioStats.balance.averageInflAdj).toBeCloseTo(1164253.2156, 4);
    expect(portfolioStats.balance.min.year).toEqual(2014);
    expect(portfolioStats.balance.max.balanceInflAdj).toBeCloseTo(
      1191404.6718,
      4
    );
    expect(portfolioStats.withdrawals.average).toBeCloseTo(40424.0374, 4);
    expect(portfolioStats.withdrawals.max.cycleStartYear).toEqual(2015);
    expect(portfolioStats.withdrawals.max.yearInCycle).toEqual(2017);
    expect(portfolioStats.withdrawals.max.amount).toBeCloseTo(41562.9827, 4);
  });

  test('calculates max length single cycle nominal withdrawal', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );

    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      simulationYearsLength: getMaxSimulationLength(longTestData),
      withdrawalMethod: WithdrawalMethod.Nominal
    });

    const data = portfolio.crunchAllCyclesData();
    const stats = portfolio.crunchAllPortfolioStats(data).cycleStats[0];

    // We need to apply a tiny error tolerance due to tiny fractional number handling differences with excel
    const percentErrorTolerance = 0.00000000001;
    const expectedEnding = 39773480353.0365;
    const expectedEndingInflAdj = 2041431119.6567;

    expect(round(stats.balance.ending, 4)).toBeGreaterThanOrEqual(
      expectedEnding - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.ending, 4)).toBeLessThanOrEqual(
      expectedEnding + expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeGreaterThanOrEqual(
      expectedEndingInflAdj - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeLessThanOrEqual(
      expectedEndingInflAdj + expectedEnding * percentErrorTolerance
    );
  });

  test('calculates max length single cycle inflation adjusted withdrawal', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );

    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      simulationYearsLength: getMaxSimulationLength(longTestData),
      withdrawalMethod: WithdrawalMethod.InflationAdjusted
    });

    const data = portfolio.crunchAllCyclesData();
    const stats = portfolio.crunchAllPortfolioStats(data).cycleStats[0];

    // We need to apply a tiny error tolerance due to tiny fractional number handling differences with excel
    const percentErrorTolerance = 0.00000000001;
    const expectedEnding = 56148384301.9503;
    const expectedEndingInflAdj = 2881896630.9971;

    expect(round(stats.balance.ending, 4)).toBeGreaterThanOrEqual(
      expectedEnding - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.ending, 4)).toBeLessThanOrEqual(
      expectedEnding + expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeGreaterThanOrEqual(
      expectedEndingInflAdj - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeLessThanOrEqual(
      expectedEndingInflAdj + expectedEnding * percentErrorTolerance
    );
  });

  test('calculates max length single cycle percent withdrawal', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );

    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      simulationYearsLength: getMaxSimulationLength(longTestData),
      withdrawalMethod: WithdrawalMethod.PercentPortfolio,
      withdrawal: { percentage: 0.04 }
    });

    const data = portfolio.crunchAllCyclesData();
    const stats = portfolio.crunchAllPortfolioStats(data).cycleStats[0];

    // We need to apply a tiny error tolerance due to tiny fractional number handling differences with excel
    const percentErrorTolerance = 0.00000000001;
    const expectedEnding = 312889323.3471;
    const expectedEndingInflAdj = 16059494.8197;

    expect(round(stats.balance.ending, 4)).toBeGreaterThanOrEqual(
      expectedEnding - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.ending, 4)).toBeLessThanOrEqual(
      expectedEnding + expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeGreaterThanOrEqual(
      expectedEndingInflAdj - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeLessThanOrEqual(
      expectedEndingInflAdj + expectedEnding * percentErrorTolerance
    );
  });

  test('calculates max length single cycle clamped percent withdrawal', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );

    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      simulationYearsLength: getMaxSimulationLength(longTestData),
      withdrawalMethod: WithdrawalMethod.PercentPortfolioClamped,
      withdrawal: { percentage: 0.04, floor: 30000, ceiling: 60000 }
    });

    const data = portfolio.crunchAllCyclesData();
    const stats = portfolio.crunchAllPortfolioStats(data).cycleStats[0];

    // We need to apply a tiny error tolerance due to tiny fractional number handling differences with excel
    const percentErrorTolerance = 0.00000000001;
    const expectedEnding = 33505765577.3321;
    const expectedEndingInflAdj = 1719731638.528;

    expect(round(stats.balance.ending, 4)).toBeGreaterThanOrEqual(
      expectedEnding - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.ending, 4)).toBeLessThanOrEqual(
      expectedEnding + expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeGreaterThanOrEqual(
      expectedEndingInflAdj - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeLessThanOrEqual(
      expectedEndingInflAdj + expectedEnding * percentErrorTolerance
    );
  });

  test('calculates max length single cycle clamped percent withdrawal edge test', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );

    const portfolio = new CyclePortfolio(longTestData, {
      simulationMethod: 'Historical Data',
      startBalance: 800000,
      investmentExpenseRatio: 0.019,
      equitiesRatio: 0.75,
      simulationYearsLength: getMaxSimulationLength(longTestData),
      withdrawalMethod: WithdrawalMethod.PercentPortfolioClamped,
      withdrawal: { percentage: 0.07, floor: 20000, ceiling: 50000 }
    });

    const data = portfolio.crunchAllCyclesData();
    const stats = portfolio.crunchAllPortfolioStats(data).cycleStats[0];

    // We need to apply a tiny error tolerance due to tiny fractional number handling differences with excel
    const percentErrorTolerance = 0.00000000001;
    const expectedEnding = -295131798.2325;
    const expectedEndingInflAdj = -15148064.2872;

    // Note, testing negative numbers, reverse tolerance operation (+/-)
    expect(round(stats.balance.ending, 4)).toBeGreaterThanOrEqual(
      expectedEnding + expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.ending, 4)).toBeLessThanOrEqual(
      expectedEnding - expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeGreaterThanOrEqual(
      expectedEndingInflAdj + expectedEnding * percentErrorTolerance
    );
    expect(round(stats.balance.endingInflAdj, 4)).toBeLessThanOrEqual(
      expectedEndingInflAdj - expectedEnding * percentErrorTolerance
    );
  });
});

/**
 * Expected values are from:
 * Portfolio Doctor Simulation, 3-Cycle Inf Adj Monte Carlo sheet
 */
describe('monte carlo simulation', () => {
  test('3 cycle simulated 3 times', () => {
    const excelStatsTestSlice = fullMarketYearData.slice(
      getYearIndex(fullMarketYearData, 2013),
      getYearIndex(fullMarketYearData, 2018) + 1
    );

    // Seed random values for each call to Math.random() that will occur
    jest
      .spyOn(global.Math, 'random')
      .mockReturnValueOnce(0.296694870605894)
      .mockReturnValueOnce(0.279680326751622)
      .mockReturnValueOnce(0.853271701727797)
      .mockReturnValueOnce(0.69306737230965)
      .mockReturnValueOnce(0.161196456935518)
      .mockReturnValueOnce(0.985188407160825)
      .mockReturnValueOnce(0.581885716265265)
      .mockReturnValueOnce(0.0833282215968913)
      .mockReturnValueOnce(0.511172862727826)
      .mockReturnValueOnce(0.457656632902557)
      .mockReturnValueOnce(0.612517212448199)
      .mockReturnValueOnce(0.729196831437739)
      .mockReturnValueOnce(0.210962776440891)
      .mockReturnValueOnce(0.99075579998327)
      .mockReturnValueOnce(0.246091026024186);

    // In production, this will always be the stats
    // since we are enforcing use of the default jan-shiller-data
    // for Monte Carlo simulations.
    // // So for this test data slice, mock that value
    jest.spyOn(dataHelpers, 'getMarketDataStats').mockReturnValue({
      meanAnnualMarketChange: 0.0602046969835648,
      stdDevAnnualMarketChange: 0.176139177843765
    });

    const simulations = generateMonteCarloRuns(
      excelStatsTestSlice,
      {
        ...starterOptions,
        simulationYearsLength: 3,
        withdrawalMethod: WithdrawalMethod.InflationAdjusted
      },
      3
    );

    console.log(
      simulations.map((cycles) => cycles.map((yr) => yr.balanceInfAdjEnd))
    );
    // console.log(simulations);

    expect(1).toEqual(1);

    jest.spyOn(global.Math, 'random').mockRestore();
  });
});
