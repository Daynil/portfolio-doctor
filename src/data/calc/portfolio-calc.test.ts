import {
  CyclePortfolio,
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

describe('basic functionality test', () => {
  test('gets year index', () => {
    const portfolioDefaultStart = new CyclePortfolio({ ...minimalOptions });
    const portfolioCustomStart = new CyclePortfolio({
      ...minimalOptions,
      startYear: 1872
    });

    expect(portfolioDefaultStart.getYearIndex(1871)).toEqual(0);
    expect(portfolioDefaultStart.getYearIndex(1875)).toEqual(4);
    expect(portfolioCustomStart.getYearIndex(1875)).toEqual(3);
  });

  test('gets max simulation cycles', () => {
    const portfolioDefault = new CyclePortfolio({
      ...minimalOptions,
      simulationYearsLength: 3
    });
    const portfolioRange = new CyclePortfolio({
      ...minimalOptions,
      simulationYearsLength: 3,
      startYear: 1990,
      endYear: 2010
    });

    expect(portfolioDefault.getMaxSimulationCycles()).toEqual(145);
    expect(portfolioRange.getMaxSimulationCycles()).toEqual(18);
  });
});

describe('full cycle portfolio tests', () => {
  test('calculates a 3 year cycle length portfolio', () => {
    const portfolio = new CyclePortfolio({
      ...starterOptions,
      simulationYearsLength: 3,
      startYear: 2013
    });
    const data = portfolio.crunchAllCyclesData();
    console.log(data);
    const endingBalance =
      data.portfolioLifecyclesData[0].stats.balance.endingInflAdj;
    expect(endingBalance).toEqual(1103529.27);
  });
});

describe('single full cycle tests', () => {
  test('calculates single cycle of portfolio data no spend adjustments', () => {
    const portfolio = new CyclePortfolio({
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.Nominal
    });

    const data = portfolio.crunchSingleCycleData();

    expect(data.stats.balance.ending).toEqual(17904102.0747708);
    expect(data.stats.balance.endingInflAdj).toEqual(13050165.103791);
  });

  test('calculates single cycle of portfolio data inflation-adjusted spend', () => {
    const portfolio = new CyclePortfolio({
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.InflationAdjusted
    });

    const data = portfolio.crunchSingleCycleData();

    expect(data.stats.balance.ending).toEqual(25319083.05280004);
    expect(data.stats.balance.endingInflAdj).toEqual(18454888.870480653);
  });

  test('calculates single cycle of portfolio data inflation-adjusted percent portfolio spend', () => {
    const portfolio = new CyclePortfolio({
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.PercentPortfolio,
      withdrawal: { percentage: 0.04 }
    });

    const data = portfolio.crunchSingleCycleData();

    expect(data.stats.balance.ending).toEqual(4707693.475645029);
    expect(data.stats.balance.endingInflAdj).toEqual(3431402.3042674037);
  });

  test('calculates single cycle of portfolio data inflation-adjusted percent portfolio spend clamped', () => {
    const portfolio = new CyclePortfolio({
      ...starterOptions,
      withdrawalMethod: WithdrawalMethod.PercentPortfolioClamped,
      withdrawal: { percentage: 0.04, floor: 30000, ceiling: 60000 }
    });

    const data = portfolio.crunchSingleCycleData();

    expect(data.stats.balance.ending).toEqual(16092611.98511732);
    expect(data.stats.balance.endingInflAdj).toEqual(11729783.626119956);
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
