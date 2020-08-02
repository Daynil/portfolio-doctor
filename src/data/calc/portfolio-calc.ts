import { maxIndex, mean, median, minIndex, sum } from 'd3-array';
import {
  DataColumns,
  pivotPortfolioCycles,
  pivotPortfolioCyclesAggregate
} from '../../utilities/util';

export interface MarketYearData {
  year: number;
  equitiesPrice: number;
  equitiesDividend: number;
  inflationIndex: number;
  fixedIncomeInterest: number;
}

export interface CycleYearData {
  cycleYear: number;
  cycleStartYear: number;
  cumulativeInflation: number;
  balanceStart: number;
  balanceInfAdjStart: number;
  withdrawal: number;
  withdrawalInfAdjust: number;
  startSubtotal: number;
  equities: number;
  equitiesGrowth: number;
  dividendsGrowth: number;
  bonds: number;
  bondsGrowth: number;
  endSubtotal: number;
  fees: number;
  balanceEnd: number;
  balanceInfAdjEnd: number;
}

export interface CycleStats {
  cycleStartYear: number;
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

export interface PortfolioStats {
  cycleStats: CycleStats[];
  numFailures: number;
  numSuccesses: number;
  successRate: number;
  /**
   * The average annual and total investment expenses paid over the course of each cycle
   */
  investmentExpenses: {
    averageAnnual: number;
    medianAnnual: number;
    averageTotal: number;
    medianTotal: number;
  };
  /**
   * The average annual and total equities price change over the course of each cycle
   */
  equitiesPriceChange: {
    averageAnnual: number;
    medianAnnual: number;
    averageTotal: number;
    medianTotal: number;
  };
  /**
   * The average annual and total dividiends paid over the course of each cycle
   */
  equitiesDividendsPaid: {
    averageAnnual: number;
    medianAnnual: number;
    averageTotal: number;
    medianTotal: number;
  };
  /**
   * The average annual and total fixed income interest paid over the course of each cycle
   */
  fixedIncomeInterestPaid: {
    averageAnnual: number;
    medianAnnual: number;
    averageTotal: number;
    medianTotal: number;
  };
  balance: {
    /**
     * The average of the ending balances for each cycle
     */
    average: number;
    /**
     * The average of the inflation adjusted ending balances for each cycle
     */
    averageInflAdj: number;
    /**
     * The median of the ending balances for each cycle
     */
    median: number;
    /**
     * The median of the inflation adjusted ending balances for each cycle
     */
    medianInflAdj: number;
    /**
     * The cycle with the lowest ending balance
     */
    min: {
      /** The cycle's start year */
      year: number;
      balance: number;
      /** The cycle's start year */
      yearInflAdj: number;
      balanceInflAdj: number;
    };
    /**
     * The cycle with the highest ending balance
     */
    max: {
      /** The cycle's start year */
      year: number;
      balance: number;
      /** The cycle's start year */
      yearInflAdj: number;
      balanceInflAdj: number;
    };
  };
  withdrawals: {
    /**
     * The average withdrawal across all cycles
     */
    average: number;
    /**
     * The average inflation adjusted withdrawal across all cycles
     */
    averageInflAdj: number;
    /**
     * The median withdrawal across all cycles
     */
    median: number;
    /**
     * The median inflation adjusted withdrawal across all cycles
     */
    medianInflAdj: number;
    /**
     * The cycle with the lowest withdrawal
     */
    min: {
      cycleStartYear: number;
      yearInCycle: number;
      /** The withdrawl amount */
      amount: number;
      cycleStartYearInflAdj: number;
      yearInCycleInflAdj: number;
      /** The inflation adjusted withdrawl amount */
      amountInflAdj: number;
    };
    /**
     * The cycle with the highest withdrawal
     */
    max: {
      cycleStartYear: number;
      yearInCycle: number;
      /** The withdrawl amount */
      amount: number;
      cycleStartYearInflAdj: number;
      yearInCycleInflAdj: number;
      /** The inflation adjusted withdrawl amount */
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

export type SimulationMethod = 'Historical Data' | 'Monte Carlo';

export interface PortfolioOptions {
  simulationYearsLength: number;
  startBalance: number;
  investmentExpenseRatio: number;
  equitiesRatio: number;
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
  constructor(
    public marketYearData: MarketYearData[],
    public options: PortfolioOptions
  ) {
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
  private crunchCycle(cycleStartYear: number): CycleYearData[] {
    const cycleData: CycleYearData[] = [];

    const cycleStartYearIndex = this.marketYearData.findIndex(
      (yearData) => yearData.year === cycleStartYear
    );

    const firstYearCPI = this.marketYearData[cycleStartYearIndex]
      .inflationIndex;

    for (
      let currYearIndex = cycleStartYearIndex;
      currYearIndex < cycleStartYearIndex + this.options.simulationYearsLength;
      currYearIndex++
    ) {
      const currYear = this.marketYearData[currYearIndex].year;

      const priorBalance =
        currYearIndex === cycleStartYearIndex
          ? this.options.startBalance
          : cycleData[cycleData.length - 1].balanceEnd;

      const yearData = this.calculateYearData(
        priorBalance,
        this.marketYearData[currYearIndex],
        this.marketYearData[currYearIndex + 1],
        firstYearCPI,
        currYearIndex === cycleStartYearIndex
      );

      cycleData.push({
        ...yearData,
        cycleYear: currYear,
        cycleStartYear
      });
    }
    return cycleData;
  }

  crunchAllPortfolioStats(
    portfolioLifecyclesData: CycleYearData[][]
  ): PortfolioStats {
    const cycleAggregate = pivotPortfolioCycles(portfolioLifecyclesData);

    const portfolioAggregate = pivotPortfolioCyclesAggregate(
      portfolioLifecyclesData
    );

    const cycleStats = cycleAggregate.map((d) =>
      this.crunchSingleCycleStats(d)
    );

    const numCycles = cycleStats.length;
    const numFailures = cycleStats
      .map((stats) => stats.failureYear)
      .reduce(
        (numFailures, failureYear) =>
          failureYear > 0 ? numFailures + 1 : numFailures,
        0
      );

    const minEndingBalanceIdx = minIndex(
      cycleStats,
      (stat) => stat.balance.ending
    );
    const minInfAdjEndingBalanceIdx = minIndex(
      cycleStats,
      (stat) => stat.balance.endingInflAdj
    );
    const maxEndingBalanceIdx = maxIndex(
      cycleStats,
      (stat) => stat.balance.ending
    );
    const maxInfAdjEndingBalanceIdx = maxIndex(
      cycleStats,
      (stat) => stat.balance.endingInflAdj
    );

    const minWithdrawalIdx = minIndex(portfolioAggregate.withdrawal);
    const minInfAdjWithdrawalIdx = minIndex(
      portfolioAggregate.withdrawalInfAdjust
    );
    const maxWithdrawalIdx = maxIndex(portfolioAggregate.withdrawal);
    const maxInfAdjWithdrawalIdx = maxIndex(
      portfolioAggregate.withdrawalInfAdjust
    );

    return {
      cycleStats,
      numFailures,
      numSuccesses: numCycles - numFailures,
      successRate: (numCycles - numFailures) / numCycles,
      investmentExpenses: {
        averageAnnual: mean(portfolioAggregate.fees),
        medianAnnual: median(portfolioAggregate.fees),
        averageTotal: mean(cycleStats, (stat) => stat.fees),
        medianTotal: median(cycleStats, (stat) => stat.fees)
      },
      equitiesPriceChange: {
        averageAnnual: mean(portfolioAggregate.equitiesGrowth),
        medianAnnual: median(portfolioAggregate.equitiesGrowth),
        averageTotal: mean(cycleStats, (stat) => stat.equitiesGrowth),
        medianTotal: median(cycleStats, (stat) => stat.equitiesGrowth)
      },
      equitiesDividendsPaid: {
        averageAnnual: mean(portfolioAggregate.dividendsGrowth),
        medianAnnual: median(portfolioAggregate.dividendsGrowth),
        averageTotal: mean(cycleStats, (stat) => stat.dividendsGrowth),
        medianTotal: median(cycleStats, (stat) => stat.dividendsGrowth)
      },
      fixedIncomeInterestPaid: {
        averageAnnual: mean(portfolioAggregate.bondsGrowth),
        medianAnnual: median(portfolioAggregate.bondsGrowth),
        averageTotal: mean(cycleStats, (stat) => stat.bondsGrowth),
        medianTotal: median(cycleStats, (stat) => stat.bondsGrowth)
      },
      balance: {
        average: mean(cycleStats, (stat) => stat.balance.ending),
        averageInflAdj: mean(cycleStats, (stat) => stat.balance.endingInflAdj),
        median: median(cycleStats, (stat) => stat.balance.ending),
        medianInflAdj: median(cycleStats, (stat) => stat.balance.endingInflAdj),
        min: {
          year: cycleStats.map((stat) => stat.cycleStartYear)[
            minEndingBalanceIdx
          ],
          balance: cycleStats.map((stat) => stat.balance.ending)[
            minEndingBalanceIdx
          ],
          yearInflAdj: cycleStats.map((stat) => stat.cycleStartYear)[
            minInfAdjEndingBalanceIdx
          ],
          balanceInflAdj: cycleStats.map((stat) => stat.balance.endingInflAdj)[
            minInfAdjEndingBalanceIdx
          ]
        },
        max: {
          year: cycleStats.map((stat) => stat.cycleStartYear)[
            maxEndingBalanceIdx
          ],
          balance: cycleStats.map((stat) => stat.balance.ending)[
            maxEndingBalanceIdx
          ],
          yearInflAdj: cycleStats.map((stat) => stat.cycleStartYear)[
            maxInfAdjEndingBalanceIdx
          ],
          balanceInflAdj: cycleStats.map((stat) => stat.balance.endingInflAdj)[
            maxInfAdjEndingBalanceIdx
          ]
        }
      },
      withdrawals: {
        average: mean(portfolioAggregate.withdrawal),
        averageInflAdj: mean(portfolioAggregate.withdrawalInfAdjust),
        median: median(portfolioAggregate.withdrawal),
        medianInflAdj: median(portfolioAggregate.withdrawalInfAdjust),
        min: {
          cycleStartYear: portfolioAggregate.cycleStartYear[minWithdrawalIdx],
          yearInCycle: portfolioAggregate.cycleYear[minWithdrawalIdx],
          amount: portfolioAggregate.withdrawal[minWithdrawalIdx],
          cycleStartYearInflAdj:
            portfolioAggregate.cycleStartYear[minInfAdjWithdrawalIdx],
          yearInCycleInflAdj:
            portfolioAggregate.cycleYear[minInfAdjWithdrawalIdx],
          amountInflAdj: portfolioAggregate.withdrawal[minInfAdjWithdrawalIdx]
        },
        max: {
          cycleStartYear: portfolioAggregate.cycleStartYear[maxWithdrawalIdx],
          yearInCycle: portfolioAggregate.cycleYear[maxWithdrawalIdx],
          amount: portfolioAggregate.withdrawal[maxWithdrawalIdx],
          cycleStartYearInflAdj:
            portfolioAggregate.cycleStartYear[maxInfAdjWithdrawalIdx],
          yearInCycleInflAdj:
            portfolioAggregate.cycleYear[maxInfAdjWithdrawalIdx],
          amountInflAdj: portfolioAggregate.withdrawal[maxInfAdjWithdrawalIdx]
        }
      }
    };
  }

  crunchSingleCycleStats(cycleYearDataColumns: DataColumns): CycleStats {
    const numYears = cycleYearDataColumns.balanceEnd.length;

    const minBalanceIdx = minIndex(cycleYearDataColumns.balanceEnd);
    const minInfAdjBalanceIdx = minIndex(cycleYearDataColumns.balanceInfAdjEnd);
    const maxBalanceIdx = maxIndex(cycleYearDataColumns.balanceEnd);
    const maxInfAdjBalanceIdx = maxIndex(cycleYearDataColumns.balanceInfAdjEnd);

    const minWithdrawalIdx = minIndex(cycleYearDataColumns.withdrawal);
    const minInfAdjWithdrawalIdx = minIndex(
      cycleYearDataColumns.withdrawalInfAdjust
    );
    const maxWithdrawalIdx = maxIndex(cycleYearDataColumns.withdrawal);
    const maxInfAdjWithdrawalIdx = maxIndex(
      cycleYearDataColumns.withdrawalInfAdjust
    );

    const failureYearIdx = cycleYearDataColumns.balanceEnd.findIndex(
      (balance) => balance <= 0
    );

    return {
      cycleStartYear: cycleYearDataColumns.cycleStartYear[0],
      fees: sum(cycleYearDataColumns.fees),
      equitiesGrowth: sum(cycleYearDataColumns.equitiesGrowth),
      dividendsGrowth: sum(cycleYearDataColumns.dividendsGrowth),
      bondsGrowth: sum(cycleYearDataColumns.bondsGrowth),
      balance: {
        total: sum(cycleYearDataColumns.balanceEnd),
        totalInflAdj: sum(cycleYearDataColumns.balanceInfAdjEnd),
        average: mean(cycleYearDataColumns.balanceEnd),
        averageInflAdj: mean(cycleYearDataColumns.balanceInfAdjEnd),
        median: median(cycleYearDataColumns.balanceEnd),
        medianInflAdj: median(cycleYearDataColumns.balanceInfAdjEnd),
        ending: cycleYearDataColumns.balanceEnd[numYears - 1],
        endingInflAdj: cycleYearDataColumns.balanceInfAdjEnd[numYears - 1],
        min: {
          year: cycleYearDataColumns.cycleYear[minBalanceIdx],
          balance: cycleYearDataColumns.balanceEnd[minBalanceIdx],
          yearInflAdj: cycleYearDataColumns.cycleYear[minInfAdjBalanceIdx],
          balanceInflAdj:
            cycleYearDataColumns.balanceInfAdjEnd[minInfAdjBalanceIdx]
        },
        max: {
          year: cycleYearDataColumns.cycleYear[maxBalanceIdx],
          balance: cycleYearDataColumns.balanceEnd[maxBalanceIdx],
          yearInflAdj: cycleYearDataColumns.cycleYear[maxInfAdjBalanceIdx],
          balanceInflAdj:
            cycleYearDataColumns.balanceInfAdjEnd[maxInfAdjBalanceIdx]
        }
      },
      withdrawals: {
        total: sum(cycleYearDataColumns.withdrawal),
        totalInflAdj: sum(cycleYearDataColumns.withdrawalInfAdjust),
        average: mean(cycleYearDataColumns.withdrawal),
        averageInflAdj: mean(cycleYearDataColumns.withdrawalInfAdjust),
        median: median(cycleYearDataColumns.withdrawal),
        medianInflAdj: median(cycleYearDataColumns.withdrawalInfAdjust),
        min: {
          year: cycleYearDataColumns.cycleYear[minWithdrawalIdx],
          amount: cycleYearDataColumns.withdrawal[minWithdrawalIdx],
          yearInflAdj: cycleYearDataColumns.cycleYear[minInfAdjWithdrawalIdx],
          amountInflAdj:
            cycleYearDataColumns.withdrawalInfAdjust[minInfAdjWithdrawalIdx]
        },
        max: {
          year: cycleYearDataColumns.cycleYear[maxWithdrawalIdx],
          amount: cycleYearDataColumns.withdrawal[maxWithdrawalIdx],
          yearInflAdj: cycleYearDataColumns.cycleYear[maxInfAdjWithdrawalIdx],
          amountInflAdj:
            cycleYearDataColumns.withdrawalInfAdjust[maxInfAdjWithdrawalIdx]
        }
      },
      failureYear:
        failureYearIdx < 0 ? 0 : cycleYearDataColumns.cycleYear[failureYearIdx]
    };
  }

  crunchSingleCycleData(): CycleYearData[] {
    return this.crunchCycle(this.marketYearData[0].year);
  }

  /**
   * Generate a portfolio lifecycle for every possible starting year.
   */
  crunchAllCyclesData(): CycleYearData[][] {
    const lastPossibleStartYear =
      this.marketYearData[this.marketYearData.length - 1].year -
      this.options.simulationYearsLength;

    const allCyclesData: CycleYearData[][] = [];

    for (
      let cycleStartYear = this.marketYearData[0].year;
      cycleStartYear <= lastPossibleStartYear;
      cycleStartYear++
    ) {
      allCyclesData.push(this.crunchCycle(cycleStartYear));
    }

    return allCyclesData;
  }

  private calculateYearData(
    startingBalance: number,
    dataCurrYear: MarketYearData,
    dataEndYear: MarketYearData,
    startYearCpi: number,
    isFirstYear: boolean
  ): Omit<CycleYearData, 'cycleStartYear'> {
    let cumulativeInflation: number;

    if (isFirstYear) cumulativeInflation = 1;
    else cumulativeInflation = dataCurrYear.inflationIndex / startYearCpi;

    const withdrawalData = this.calculateWithdrawal(
      startingBalance,
      cumulativeInflation
    );

    const yearStartSubtotal = startingBalance - withdrawalData.actual;

    const equities = yearStartSubtotal * this.options.equitiesRatio;
    const equitiesGrowth =
      ((dataEndYear.equitiesPrice - dataCurrYear.equitiesPrice) /
        dataCurrYear.equitiesPrice) *
      equities;

    const dividendsGrowth =
      (dataCurrYear.equitiesDividend / dataCurrYear.equitiesPrice) * equities;

    const bonds = yearStartSubtotal * (1 - this.options.equitiesRatio);
    const bondsGrowth = (dataCurrYear.fixedIncomeInterest / 100) * bonds;

    const portfolioEndSubtotal =
      equities + bonds + equitiesGrowth + dividendsGrowth + bondsGrowth;
    const fees = portfolioEndSubtotal * this.options.investmentExpenseRatio;
    const portfolioEnd = portfolioEndSubtotal - fees;
    const portfolioInfAdjEnd = portfolioEnd / cumulativeInflation;

    return {
      cycleYear: 0,
      cumulativeInflation,
      balanceStart: startingBalance,
      balanceInfAdjStart: startingBalance / cumulativeInflation,
      withdrawal: withdrawalData.actual,
      withdrawalInfAdjust: withdrawalData.infAdj,
      startSubtotal: startingBalance - withdrawalData.actual,
      equities,
      equitiesGrowth,
      dividendsGrowth,
      bonds,
      bondsGrowth,
      endSubtotal: portfolioEndSubtotal,
      fees,
      balanceEnd: portfolioEnd,
      balanceInfAdjEnd: portfolioInfAdjEnd
    };
  }

  calculateWithdrawal(
    portfolioStart: number,
    cumulativeInflation: number
  ): {
    actual: number;
    infAdj: number;
  } {
    const withdrawal = {} as { actual: number; infAdj: number };
    switch (this.options.withdrawalMethod) {
      case WithdrawalMethod.Nominal:
        withdrawal.actual = this.options.withdrawal.staticAmount;
        // In withdrawal's case, inflation adjusted means value in todays dollars
        withdrawal.infAdj = withdrawal.actual / cumulativeInflation;
        break;
      case WithdrawalMethod.InflationAdjusted:
        withdrawal.actual =
          this.options.withdrawal.staticAmount * cumulativeInflation;
        withdrawal.infAdj = withdrawal.actual / cumulativeInflation;
        break;
      case WithdrawalMethod.PercentPortfolio:
        withdrawal.actual = this.options.withdrawal.percentage * portfolioStart;
        withdrawal.infAdj = withdrawal.actual / cumulativeInflation;
        break;
      case WithdrawalMethod.PercentPortfolioClamped:
        let infAdjSpend =
          this.options.withdrawal.percentage *
          (portfolioStart / cumulativeInflation);
        if (infAdjSpend < this.options.withdrawal.floor) {
          infAdjSpend = this.options.withdrawal.floor;
        } else if (infAdjSpend > this.options.withdrawal.ceiling) {
          infAdjSpend = this.options.withdrawal.ceiling;
        }
        withdrawal.actual = infAdjSpend * cumulativeInflation;
        withdrawal.infAdj = infAdjSpend;
        break;
    }
    return withdrawal;
  }

  getYearIndex(year: number) {
    return year - this.marketYearData[0].year;
  }

  getMaxSimulationCycles(): number {
    const lastPossibleStartYear =
      this.marketYearData[this.marketYearData.length - 1].year -
      this.options.simulationYearsLength;
    // Add 1 to include start year
    return lastPossibleStartYear - this.marketYearData[0].year + 1;
  }
}

export function getYearIndex(
  marketData: MarketYearData[],
  year: number
): number {
  return year - marketData[0].year;
}

export function getMaxSimulationLength(marketData: MarketYearData[]): number {
  return marketData.length - 1;
}
