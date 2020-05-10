import { max, mean, median, min } from '../../utilities/math';
import marketData from '../data.json';

export interface MarketYearData {
  year: number;
  price: number;
  dividend: number;
  fixedIncomeInterest: number;
  cpi: number;
}

export interface CycleYearData {
  year: number;
  cumulativeInflation: number;
  balanceStart: number;
  balanceInfAdjStart: number;
  withdrawal: number;
  withdrawalInfAdjust: number;
  equities: number;
  bonds: number;
  equitiesGrowth: number;
  dividendsGrowth: number;
  bondsGrowth: number;
  fees: number;
  balanceEnd: number;
  balanceInfAdjEnd: number;
}

export interface CycleStats {
  fees: number;
  equitiesGrowth: number;
  dividendsGrowth: number;
  bondsGrowth: number;
  balance: {
    total: number;
    totalInflAdj: number;
    average: number;
    averageInflAdj: number;
    median: number;
    medianInflAdj: number;
    min: {
      year: number;
      balance: number;
      yearInflAdj: number;
      balanceInflAdj: number;
    };
    max: {
      year: number;
      balance: number;
      yearInflAdj: number;
      balanceInflAdj: number;
    };
    ending: number;
    endingInflAdj: number;
  };
  withdrawals: {
    total: number;
    totalInflAdj: number;
    average: number;
    averageInflAdj: number;
    median: number;
    medianInflAdj: number;
    min: {
      year: number;
      amount: number;
      yearInflAdj: number;
      amountInflAdj: number;
    };
    max: {
      year: number;
      amount: number;
      yearInflAdj: number;
      amountInflAdj: number;
    };
  };

  failureYear: number;
}

export interface CycleData {
  yearData: CycleYearData[];
  stats: CycleStats;
}

export interface PortfolioStats {
  numFailures: number;
  numSuccesses: number;
  successRate: number;
  investmentExpenses: {
    average: number;
    median: number;
  };
  equitiesPriceChange: {
    average: number;
    median: number;
  };
  equitiesDividendsPaid: {
    average: number;
    median: number;
  };
  fixedIncomeInterestPaid: {
    average: number;
    median: number;
  };
  balance: {
    average: number;
    averageInflAdj: number;
    median: number;
    medianInflAdj: number;
    min: {
      year: number;
      balance: number;
      yearInflAdj: number;
      balanceInflAdj: number;
    };
    max: {
      year: number;
      balance: number;
      yearInflAdj: number;
      balanceInflAdj: number;
    };
  };
  withdrawals: {
    average: number;
    averageInflAdj: number;
    median: number;
    medianInflAdj: number;
    min: {
      year: number;
      amount: number;
      yearInflAdj: number;
      amountInflAdj: number;
    };
    max: {
      year: number;
      amount: number;
      yearInflAdj: number;
      amountInflAdj: number;
    };
  };
}

export enum WithdrawalMethod {
  Nominal,
  InflationAdjusted,
  PercentPortfolio,
  PercentPortfolioClamped
}

export interface PortfolioOptions {
  simulationYearsLength: number;
  startBalance: number;
  investmentExpenseRatio: number;
  equitiesRatio: number;
  startYear?: number;
  endYear?: number;
  startMonth?: number;
  withdrawalMethod: WithdrawalMethod;
  withdrawal: WithdrawalOptions;
}

export interface WithdrawalOptions {
  staticAmount?: number;
  percentage?: number;
  floor?: number;
  ceiling?: number;
}

export class CyclePortfolio {
  marketYearData: MarketYearData[];

  constructor(public options: PortfolioOptions) {
    if (!this.options.startMonth) this.options.startMonth = 1;
    this.marketYearData = marketData[this.options.startMonth];

    if (!this.options.startYear)
      this.options.startYear = this.marketYearData[0].year;
    if (!this.options.endYear)
      this.options.endYear = this.marketYearData[
        this.marketYearData.length - 1
      ].year;
    switch (this.options.withdrawalMethod) {
      case WithdrawalMethod.Nominal:
      case WithdrawalMethod.InflationAdjusted:
        if (!this.options.withdrawal.staticAmount)
          throw new Error('Missing withdrawal amount');
        break;
      case WithdrawalMethod.PercentPortfolio:
        if (!this.options.withdrawal.percentage)
          throw new Error('Missing withdrawal percentage');
        break;
      case WithdrawalMethod.PercentPortfolioClamped:
        if (
          !this.options.withdrawal.percentage ||
          !this.options.withdrawal.floor ||
          !this.options.withdrawal.ceiling
        )
          throw new Error('Missing withdrawal percentage, floor, or ceiling');
        break;
      default:
        break;
    }
  }

  /**
   * Generate data for each year in a portfolio lifecycle
   */
  private crunchCycle(cycleStartYear: number): CycleData {
    const cycleData: CycleData = {
      yearData: [],
      stats: {
        fees: 0,
        equitiesGrowth: 0,
        dividendsGrowth: 0,
        bondsGrowth: 0,
        balance: {
          total: 0,
          totalInflAdj: 0,
          average: 0,
          averageInflAdj: 0,
          median: 0,
          medianInflAdj: 0,
          ending: 0,
          endingInflAdj: 0
        },
        withdrawals: {
          total: 0,
          totalInflAdj: 0,
          average: 0,
          averageInflAdj: 0,
          median: 0,
          medianInflAdj: 0
        },
        failureYear: 0
      } as CycleStats
    };

    const cycleStartYearIndex = this.marketYearData.findIndex(
      (yearData) => yearData.year === cycleStartYear
    );

    const firstYearCPI = this.marketYearData[cycleStartYearIndex].cpi;

    for (
      let currYearIndex = cycleStartYearIndex;
      currYearIndex < cycleStartYearIndex + this.options.simulationYearsLength;
      currYearIndex++
    ) {
      const currYear = this.marketYearData[currYearIndex].year;

      const priorBalance =
        currYearIndex === cycleStartYearIndex
          ? this.options.startBalance
          : cycleData.yearData[cycleData.yearData.length - 1].balanceEnd;

      const yearData = this.calculateYearData(
        priorBalance,
        this.marketYearData[currYearIndex],
        this.marketYearData[currYearIndex + 1],
        firstYearCPI,
        currYearIndex === cycleStartYearIndex
      );

      cycleData.yearData.push({ ...yearData, year: currYear });

      // Add up totals
      const cycleStats = cycleData.stats;

      cycleStats.fees += yearData.fees;
      cycleStats.equitiesGrowth += yearData.equitiesGrowth;
      cycleStats.dividendsGrowth += yearData.dividendsGrowth;
      cycleStats.bondsGrowth += yearData.bondsGrowth;
      cycleStats.balance.total += yearData.balanceEnd;
      cycleStats.balance.totalInflAdj += yearData.balanceInfAdjEnd;
      cycleStats.withdrawals.total += yearData.withdrawal;
      cycleStats.withdrawals.totalInflAdj += yearData.withdrawalInfAdjust;

      // Adjust min/max
      if (!cycleStats.balance.min) {
        cycleStats.balance.min = {
          year: currYear,
          balance: yearData.balanceEnd,
          yearInflAdj: currYear,
          balanceInflAdj: yearData.balanceInfAdjEnd
        };
      } else {
        if (yearData.balanceEnd < cycleStats.balance.min.balance) {
          cycleStats.balance.min.year = currYear;
          cycleStats.balance.min.balance = yearData.balanceEnd;
        }
        if (yearData.balanceInfAdjEnd < cycleStats.balance.min.balanceInflAdj) {
          cycleStats.balance.min.yearInflAdj = currYear;
          cycleStats.balance.min.balanceInflAdj = yearData.balanceInfAdjEnd;
        }
      }
      if (!cycleStats.balance.max) {
        cycleStats.balance.max = {
          year: currYear,
          balance: yearData.balanceEnd,
          yearInflAdj: currYear,
          balanceInflAdj: yearData.balanceInfAdjEnd
        };
      } else {
        if (yearData.balanceEnd > cycleStats.balance.max.balance) {
          cycleStats.balance.max.year = currYear;
          cycleStats.balance.max.balance = yearData.balanceEnd;
        }
        if (yearData.balanceInfAdjEnd > cycleStats.balance.max.balanceInflAdj) {
          cycleStats.balance.max.yearInflAdj = currYear;
          cycleStats.balance.max.balanceInflAdj = yearData.balanceInfAdjEnd;
        }
      }
      if (!cycleStats.withdrawals.min) {
        cycleStats.withdrawals.min = {
          year: currYear,
          amount: yearData.withdrawal,
          yearInflAdj: currYear,
          amountInflAdj: yearData.withdrawalInfAdjust
        };
      } else {
        if (yearData.withdrawal < cycleStats.withdrawals.min.amount) {
          cycleStats.withdrawals.min.year = currYear;
          cycleStats.withdrawals.min.amount = yearData.withdrawal;
        }
        if (
          yearData.withdrawalInfAdjust <
          cycleStats.withdrawals.min.amountInflAdj
        ) {
          cycleStats.withdrawals.min.yearInflAdj = currYear;
          cycleStats.withdrawals.min.amountInflAdj =
            yearData.withdrawalInfAdjust;
        }
      }
      if (!cycleStats.withdrawals.max) {
        cycleStats.withdrawals.max = {
          year: currYear,
          amount: yearData.withdrawal,
          yearInflAdj: currYear,
          amountInflAdj: yearData.withdrawalInfAdjust
        };
      } else {
        if (yearData.withdrawal > cycleStats.withdrawals.max.amount) {
          cycleStats.withdrawals.max.year = currYear;
          cycleStats.withdrawals.max.amount = yearData.withdrawal;
        }
        if (
          yearData.withdrawalInfAdjust >
          cycleStats.withdrawals.max.amountInflAdj
        ) {
          cycleStats.withdrawals.max.yearInflAdj = currYear;
          cycleStats.withdrawals.max.amountInflAdj =
            yearData.withdrawalInfAdjust;
        }
      }
      if (cycleStats.failureYear === 0 && yearData.balanceEnd <= 0) {
        cycleStats.failureYear = currYear;
      }
      if (
        currYearIndex ===
        cycleStartYearIndex + this.options.simulationYearsLength - 1
      ) {
        cycleStats.balance.ending = yearData.balanceEnd;
        cycleStats.balance.endingInflAdj = yearData.balanceInfAdjEnd;
      }
    }
    // Calculate stats
    const cycleStats = cycleData.stats;

    cycleStats.balance.average =
      cycleStats.balance.total / this.options.simulationYearsLength;
    cycleStats.balance.averageInflAdj =
      cycleStats.balance.totalInflAdj / this.options.simulationYearsLength;
    cycleStats.withdrawals.average =
      cycleStats.withdrawals.total / this.options.simulationYearsLength;
    cycleStats.withdrawals.averageInflAdj =
      cycleStats.withdrawals.totalInflAdj / this.options.simulationYearsLength;

    cycleStats.balance.median = median(
      cycleData.yearData.map((yearData) => yearData.balanceEnd)
    );
    cycleStats.balance.medianInflAdj = median(
      cycleData.yearData.map((yearData) => yearData.balanceInfAdjEnd)
    );
    cycleStats.withdrawals.median = median(
      cycleData.yearData.map((yearData) => yearData.withdrawal)
    );
    cycleStats.withdrawals.medianInflAdj = median(
      cycleData.yearData.map((yearData) => yearData.withdrawalInfAdjust)
    );

    return cycleData;
  }

  crunchSingleCycleData(): CycleData {
    return this.crunchCycle(this.options.startYear);
  }

  /**
   * Generate a portfolio lifecycle for every possible starting year.
   */
  crunchAllCyclesData(): {
    portfolioLifecyclesData: CycleData[];
    portfolioStats: PortfolioStats;
  } {
    const lastYearIndex = this.getYearIndex(this.options.endYear);
    const lastPossibleStartYear =
      this.marketYearData[lastYearIndex].year -
      this.options.simulationYearsLength;

    const allCyclesData: CycleData[] = [];

    for (
      let cycleStartYear = this.options.startYear;
      cycleStartYear <= lastPossibleStartYear;
      cycleStartYear++
    ) {
      allCyclesData.push(this.crunchCycle(cycleStartYear));
    }

    return {
      portfolioLifecyclesData: allCyclesData,
      portfolioStats: this.crunchPortfolioStats(allCyclesData)
    };
  }

  crunchPortfolioStats(portfolioData: CycleData[]): PortfolioStats {
    const portfolioStats: PortfolioStats = {
      numFailures: 0,
      numSuccesses: 0,
      successRate: 0,
      investmentExpenses: {
        average: 0,
        median: 0
      },
      equitiesPriceChange: {
        average: 0,
        median: 0
      },
      equitiesDividendsPaid: {
        average: 0,
        median: 0
      },
      fixedIncomeInterestPaid: {
        average: 0,
        median: 0
      },
      balance: {
        average: 0,
        averageInflAdj: 0,
        median: 0,
        medianInflAdj: 0,
        min: {
          year: 0,
          balance: 0,
          yearInflAdj: 0,
          balanceInflAdj: 0
        },
        max: {
          year: 0,
          balance: 0,
          yearInflAdj: 0,
          balanceInflAdj: 0
        }
      },
      withdrawals: {
        average: 0,
        averageInflAdj: 0,
        median: 0,
        medianInflAdj: 0,
        min: {
          year: 0,
          amount: 0,
          yearInflAdj: 0,
          amountInflAdj: 0
        },
        max: {
          year: 0,
          amount: 0,
          yearInflAdj: 0,
          amountInflAdj: 0
        }
      }
    };

    const cycleDataStats = portfolioData.map((cycleData) => cycleData.stats);

    portfolioStats.numFailures = cycleDataStats
      .map((stats) => stats.failureYear)
      .reduce(
        (numFailures, failureYear) =>
          failureYear > 0 ? numFailures + 1 : numFailures,
        0
      );
    portfolioStats.numSuccesses =
      cycleDataStats.length - portfolioStats.numFailures;
    portfolioStats.successRate =
      portfolioStats.numSuccesses / cycleDataStats.length;

    const investmentExpenses = cycleDataStats.map((stats) => stats.fees);
    portfolioStats.investmentExpenses.average = mean(investmentExpenses);
    portfolioStats.investmentExpenses.median = median(investmentExpenses);

    const equitiesPriceChanges = cycleDataStats.map(
      (stats) => stats.equitiesGrowth
    );
    portfolioStats.equitiesPriceChange.average = mean(equitiesPriceChanges);
    portfolioStats.equitiesPriceChange.median = median(equitiesPriceChanges);

    const equitiesDividendsPaid = cycleDataStats.map(
      (stats) => stats.dividendsGrowth
    );
    portfolioStats.equitiesDividendsPaid.average = mean(equitiesDividendsPaid);
    portfolioStats.equitiesDividendsPaid.median = median(equitiesDividendsPaid);

    const fixedIncomeInterestPaid = cycleDataStats.map(
      (stats) => stats.bondsGrowth
    );
    portfolioStats.fixedIncomeInterestPaid.average = mean(
      fixedIncomeInterestPaid
    );
    portfolioStats.fixedIncomeInterestPaid.median = median(
      fixedIncomeInterestPaid
    );

    const balances = cycleDataStats.map((stats) => stats.balance.ending);
    portfolioStats.balance.average = mean(balances);
    portfolioStats.balance.median = median(balances);
    const balancesMin = min(balances);
    const balancesMax = max(balances);
    portfolioStats.balance.min.year =
      this.options.startYear + balancesMin.index;
    portfolioStats.balance.min.balance = balancesMin.value;
    portfolioStats.balance.max.year =
      this.options.startYear + balancesMax.index;
    portfolioStats.balance.max.balance = balancesMax.value;

    const balancesInflationAdjusted = cycleDataStats.map(
      (stats) => stats.balance.endingInflAdj
    );
    const balancesInflationAdjustedMin = min(balancesInflationAdjusted);
    const balancesInflationAdjustedMax = max(balancesInflationAdjusted);
    portfolioStats.balance.averageInflAdj = mean(balancesInflationAdjusted);
    portfolioStats.balance.medianInflAdj = median(balancesInflationAdjusted);
    portfolioStats.balance.min.yearInflAdj =
      this.options.startYear + balancesInflationAdjustedMin.index;
    portfolioStats.balance.min.balanceInflAdj =
      balancesInflationAdjustedMin.value;
    portfolioStats.balance.max.yearInflAdj =
      this.options.startYear + balancesInflationAdjustedMax.index;
    portfolioStats.balance.max.balanceInflAdj =
      balancesInflationAdjustedMax.value;

    portfolioStats.withdrawals.average = mean(
      cycleDataStats.map((stats) => stats.withdrawals.average)
    );

    portfolioStats.withdrawals.averageInflAdj = mean(
      cycleDataStats.map((stats) => stats.withdrawals.averageInflAdj)
    );

    // Median of medians doesn't work, just take the average of medians
    portfolioStats.withdrawals.median = mean(
      cycleDataStats.map((stats) => stats.withdrawals.median)
    );

    portfolioStats.withdrawals.medianInflAdj = mean(
      cycleDataStats.map((stats) => stats.withdrawals.medianInflAdj)
    );

    const withdrawalsMinsYears = cycleDataStats.map(
      (stats) => stats.withdrawals.min.year
    );
    const withdrawalsMinsVals = cycleDataStats.map(
      (stats) => stats.withdrawals.min.amount
    );
    const withdrawalsMinsMin = min(withdrawalsMinsVals);

    portfolioStats.withdrawals.min.amount = withdrawalsMinsMin.value;
    portfolioStats.withdrawals.min.year =
      withdrawalsMinsYears[withdrawalsMinsMin.index];

    const withdrawalsMinsInflAdjYears = cycleDataStats.map(
      (stats) => stats.withdrawals.min.yearInflAdj
    );
    const withdrawalsMinsInflAdjVals = cycleDataStats.map(
      (stats) => stats.withdrawals.min.amountInflAdj
    );
    const withdrawalsMinsInflAdjMin = min(withdrawalsMinsInflAdjVals);

    portfolioStats.withdrawals.min.amountInflAdj =
      withdrawalsMinsInflAdjMin.value;
    portfolioStats.withdrawals.min.yearInflAdj =
      withdrawalsMinsInflAdjYears[withdrawalsMinsInflAdjMin.index];

    const withdrawalsMaxesYears = cycleDataStats.map(
      (stats) => stats.withdrawals.max.year
    );
    const withdrawalsMaxesVals = cycleDataStats.map(
      (stats) => stats.withdrawals.max.amount
    );
    const withdrawalsMaxesMax = max(withdrawalsMaxesVals);

    portfolioStats.withdrawals.max.amount = withdrawalsMaxesMax.value;
    portfolioStats.withdrawals.max.year =
      withdrawalsMaxesYears[withdrawalsMaxesMax.index];

    const withdrawalsMaxesInflAdjYears = cycleDataStats.map(
      (stats) => stats.withdrawals.max.yearInflAdj
    );
    const withdrawalsMaxesInflAdjVals = cycleDataStats.map(
      (stats) => stats.withdrawals.max.amountInflAdj
    );
    const withdrawalsMaxesInflAdjMax = max(withdrawalsMaxesInflAdjVals);

    portfolioStats.withdrawals.max.amountInflAdj =
      withdrawalsMaxesInflAdjMax.value;
    portfolioStats.withdrawals.max.yearInflAdj =
      withdrawalsMaxesInflAdjYears[withdrawalsMaxesInflAdjMax.index];

    return portfolioStats;
  }

  private calculateYearData(
    startingBalance: number,
    dataCurrYear: MarketYearData,
    dataEndYear: MarketYearData,
    startYearCpi: number,
    isFirstYear: boolean
  ): CycleYearData {
    let cumulativeInflation: number;

    if (isFirstYear) cumulativeInflation = 1;
    else cumulativeInflation = dataCurrYear.cpi / startYearCpi;

    const portfolioInfAdjStart = startingBalance / cumulativeInflation;

    const withdrawalData = this.calculateWithdrawal(
      portfolioInfAdjStart,
      cumulativeInflation
    );

    const yearStartSubtotal = startingBalance - withdrawalData.actual;

    const equities = yearStartSubtotal * this.options.equitiesRatio;
    const equitiesGrowth =
      ((dataEndYear.price - dataCurrYear.price) / dataCurrYear.price) *
      equities;

    const dividendsGrowth =
      (dataCurrYear.dividend / dataCurrYear.price) * equities;

    const bonds = yearStartSubtotal * (1 - this.options.equitiesRatio);
    const bondsGrowth = (dataCurrYear.fixedIncomeInterest / 100) * bonds;

    const portfolioEndSubtotal =
      equities + bonds + equitiesGrowth + dividendsGrowth + bondsGrowth;
    const fees = portfolioEndSubtotal * this.options.investmentExpenseRatio;
    const portfolioEnd = portfolioEndSubtotal - fees;
    const portfolioInfAdjEnd = portfolioEnd / cumulativeInflation;

    return {
      year: 0,
      cumulativeInflation,
      balanceStart: startingBalance,
      balanceInfAdjStart: portfolioInfAdjStart,
      withdrawal: withdrawalData.actual,
      withdrawalInfAdjust: withdrawalData.infAdj,
      equities,
      bonds,
      equitiesGrowth,
      dividendsGrowth,
      bondsGrowth,
      fees,
      balanceEnd: portfolioEnd,
      balanceInfAdjEnd: portfolioInfAdjEnd
    };
  }

  calculateWithdrawal(
    portfolioInfAdjStart: number,
    cumulativeInflation: number
  ): {
    actual: number;
    infAdj: number;
  } {
    const withdrawal = {} as { actual: number; infAdj: number };
    switch (this.options.withdrawalMethod) {
      case WithdrawalMethod.Nominal:
        withdrawal.infAdj = this.options.withdrawal.staticAmount;
        withdrawal.actual = withdrawal.infAdj;
        break;
      case WithdrawalMethod.InflationAdjusted:
        withdrawal.infAdj = this.options.withdrawal.staticAmount;
        withdrawal.actual = withdrawal.infAdj * cumulativeInflation;
        break;
      case WithdrawalMethod.PercentPortfolio:
        withdrawal.infAdj =
          this.options.withdrawal.percentage * portfolioInfAdjStart;
        withdrawal.actual = withdrawal.infAdj * cumulativeInflation;
        break;
      case WithdrawalMethod.PercentPortfolioClamped:
        const infAdjSpendRaw =
          this.options.withdrawal.percentage * portfolioInfAdjStart;
        if (infAdjSpendRaw < this.options.withdrawal.floor) {
          withdrawal.infAdj = this.options.withdrawal.floor;
        } else if (infAdjSpendRaw > this.options.withdrawal.ceiling) {
          withdrawal.infAdj = this.options.withdrawal.ceiling;
        } else withdrawal.infAdj = infAdjSpendRaw;
        withdrawal.actual = withdrawal.infAdj * cumulativeInflation;
        break;
    }
    return withdrawal;
  }

  getYearIndex(year: number) {
    return year - this.options.startYear;
  }

  getMaxSimulationCycles(): number {
    const lastPossibleStartYear =
      this.options.endYear - this.options.simulationYearsLength;
    // Add 1 to include start year
    return lastPossibleStartYear - this.options.startYear + 1;
  }
}

export function getMaxSimulationLength(): number {
  return marketData[1].length - 1;
}
