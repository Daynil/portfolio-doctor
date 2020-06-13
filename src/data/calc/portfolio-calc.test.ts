import { readFileSync } from 'fs';
import { round } from '../../utilities/math';
import { parseCSVStringToJSON } from '../data-helpers';
import {
  CyclePortfolio,
  getYearIndex,
  MarketYearData,
  PortfolioOptions,
  WithdrawalMethod
} from './portfolio-calc';

const minimalOptions: PortfolioOptions = {
  investmentExpenseRatio: 1,
  equitiesRatio: 1,
  simulationYearsLength: 1,
  startBalance: 1,
  withdrawalMethod: WithdrawalMethod.Nominal,
  withdrawal: { staticAmount: 1 }
};

const starterOptions: PortfolioOptions = {
  startBalance: 1000000,
  equitiesRatio: 0.9,
  investmentExpenseRatio: 0.0025,
  simulationYearsLength: 60,
  withdrawalMethod: WithdrawalMethod.Nominal,
  withdrawal: { staticAmount: 40000 }
};

let fullMarketYearData: MarketYearData[];

beforeAll(async () => {
  const csvString = readFileSync(require.resolve('../jan-shiller-data.csv'), {
    encoding: 'utf8'
  });
  fullMarketYearData = parseCSVStringToJSON(csvString);
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

describe('full cycle portfolio tests', () => {
  test('calculates a 3 year cycle length portfolio', () => {
    const testSlice = fullMarketYearData.slice(
      getYearIndex(fullMarketYearData, 2013),
      getYearIndex(fullMarketYearData, 2018) + 1
    );
    const portfolio = new CyclePortfolio(testSlice, {
      ...starterOptions,
      simulationYearsLength: 3
    });
    const data = portfolio.crunchAllCyclesData();
    expect(
      round(data.portfolioLifecyclesData[0].stats.balance.endingInflAdj, 4)
    ).toEqual(1176082.0295);
    expect(
      round(data.portfolioLifecyclesData[1].stats.balance.endingInflAdj, 4)
    ).toEqual(1127076.1635);
    expect(
      round(data.portfolioLifecyclesData[2].stats.balance.endingInflAdj, 4)
    ).toEqual(1194007.547);
  });
});

describe('single full cycle tests', () => {
  test('calculates single cycle of portfolio data no spend adjustments', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );

    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.Nominal
    });

    const data = portfolio.crunchSingleCycleData();

    expect(round(data.stats.balance.ending, 4)).toEqual(17904102.0748);
    expect(round(data.stats.balance.endingInflAdj, 4)).toEqual(13050165.1038);
  });

  test('calculates single cycle of portfolio data inflation-adjusted spend', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );
    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.InflationAdjusted
    });

    const data = portfolio.crunchSingleCycleData();

    expect(round(data.stats.balance.ending, 4)).toEqual(25319083.0553);
    expect(round(data.stats.balance.endingInflAdj, 4)).toEqual(18454888.8723);
  });

  test('calculates single cycle of portfolio data inflation-adjusted percent portfolio spend', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );
    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.PercentPortfolio,
      withdrawal: { percentage: 0.04 }
    });

    const data = portfolio.crunchSingleCycleData();

    expect(round(data.stats.balance.ending, 4)).toEqual(4707693.4756);
    expect(round(data.stats.balance.endingInflAdj, 4)).toEqual(3431402.3043);
  });

  test('calculates single cycle of portfolio data inflation-adjusted percent portfolio spend clamped', () => {
    const longTestData = fullMarketYearData.slice(
      0,
      getYearIndex(fullMarketYearData, 2018) + 1
    );
    const portfolio = new CyclePortfolio(longTestData, {
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.PercentPortfolioClamped,
      withdrawal: { percentage: 0.04, floor: 30000, ceiling: 60000 }
    });

    const data = portfolio.crunchSingleCycleData();

    expect(round(data.stats.balance.ending, 4)).toEqual(16092611.9878);
    expect(round(data.stats.balance.endingInflAdj, 4)).toEqual(11729783.6281);
  });

  // TODO add tests for stats using excel to test results

  // test('calculates portfolio data for all cycles Excel 30-year standard inflation-only withdrawal adjustments', () => {
  //   const simulationYearsLength = 30;
  //   const portfolio = new CyclePortfolio(
  //     simulationYearsLength,
  //     750000,
  //     40000,
  //     0.0025,
  //     0.9
  //   );

  //   const data = portfolio.crunchAllCyclesData();

  //   const testYearCycleIndex = portfolio.getYearIndex(1947);

  //   const cycleData: CycleYearData =
  //     data.portfolioLifecyclesData[testYearCycleIndex].yearData[
  //       simulationYearsLength - 1
  //     ];

  //   expect(data.portfolioLifecyclesData.length).toEqual(
  //     portfolio.getMaxSimulationCycles()
  //   );
  //   expect(cycleData.endingBalance).toEqual(5845098.191462328);
  //   expect(cycleData.endingBalanceInflationAdjusted).toEqual(
  //     2148198.4806229067
  //   );

  //   expect(data.portfolioStats.balance.min.balanceInflationAdjusted).toEqual(
  //     -1779807.9946233602
  //   );
  //   expect(data.portfolioStats.balance.min.yearInflationAdjusted).toEqual(1969);

  //   expect(data.portfolioStats.balance.max.balanceInflationAdjusted).toEqual(
  //     3415870.0459871544
  //   );
  //   expect(data.portfolioStats.balance.max.yearInflationAdjusted).toEqual(1942);
  // });

  // test('calculates portfolio stats Excel 30-year standard inflation-only withdrawal adjustments', () => {
  //   const simulationYearsLength = 30;
  //   const portfolio = new CyclePortfolio(
  //     simulationYearsLength,
  //     750000,
  //     40000,
  //     0.0025,
  //     0.9,
  //     0,
  //     2010
  //   );

  //   const data = portfolio.crunchAllCyclesData();

  //   expect(data.portfolioStats.balance.min.balanceInflationAdjusted).toEqual(
  //     -1779807.9946233602
  //   );
  //   expect(data.portfolioStats.balance.min.yearInflationAdjusted).toEqual(1969);

  //   expect(data.portfolioStats.balance.max.balanceInflationAdjusted).toEqual(
  //     3415870.0459871544
  //   );
  //   expect(data.portfolioStats.balance.max.yearInflationAdjusted).toEqual(1942);

  //   expect(data.portfolioStats.balance.averageInflationAdjusted).toEqual(
  //     811115.8003447562
  //   );
  //   expect(data.portfolioStats.balance.medianInflationAdjusted).toEqual(
  //     494394.77437198
  //   );

  //   expect(data.portfolioStats.numFailures).toEqual(32);
  //   expect(data.portfolioStats.successRate).toEqual(0.7090909090909091);
  // });

  // test('calculates portfolio stats Excel 60-year ideal inflation-only withdrawal adjustments', () => {
  //   const simulationYearsLength = 60;
  //   const portfolio = new CyclePortfolio(
  //     simulationYearsLength,
  //     1000000,
  //     40000,
  //     0.0025,
  //     0.9,
  //     0,
  //     2010
  //   );

  //   const data = portfolio.crunchAllCyclesData();

  //   expect(data.portfolioStats.balance.min.balanceInflationAdjusted).toEqual(
  //     -3548169.4463472776
  //   );
  //   expect(data.portfolioStats.balance.min.yearInflationAdjusted).toEqual(1906);

  //   expect(data.portfolioStats.balance.max.balanceInflationAdjusted).toEqual(
  //     29156078.41501105
  //   );
  //   expect(data.portfolioStats.balance.max.yearInflationAdjusted).toEqual(1942);

  //   expect(data.portfolioStats.balance.averageInflationAdjusted).toEqual(
  //     9561010.562227538
  //   );
  //   expect(data.portfolioStats.balance.medianInflationAdjusted).toEqual(
  //     8063140.758806086
  //   );

  //   expect(data.portfolioStats.successRate).toEqual(0.8875);
  // });

  // test('mine', () => {
  //   const portfolioMine = new CyclePortfolio(60, 750000, 40000, 0.0025, 0.9);
  //   const data = portfolioMine.crunchAllCyclesData();
  //   expect(1).toEqual(1);
  // });
});
