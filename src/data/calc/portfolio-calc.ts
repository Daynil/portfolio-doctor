import { median, sum } from 'd3-array';
import { mean } from '../../utilities/math';
//import { max, mean, median, min } from '../../utilities/math';
import { pivotPortfolioCycles, YearDataColumns } from '../../utilities/util';

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
  /**
   * The average total investment expenses paid over the course of each cycle
   */
  investmentExpenses: {
    average: number;
    median: number;
  };
  /**
   * The average total equities price change over the course of each cycle
   */
  equitiesPriceChange: {
    average: number;
    median: number;
  };
  /**
   * The average total dividiends paid over the course of each cycle
   */
  equitiesDividendsPaid: {
    average: number;
    median: number;
  };
  /**
   * The average total fixed income interest paid over the course of each cycle
   */
  fixedIncomeInterestPaid: {
    average: number;
    median: number;
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
          : cycleData.yearData[cycleData.yearData.length - 1].balanceEnd;

      const yearData = this.calculateYearData(
        priorBalance,
        this.marketYearData[currYearIndex],
        this.marketYearData[currYearIndex + 1],
        firstYearCPI,
        currYearIndex === cycleStartYearIndex
      );

      cycleData.yearData.push({
        ...yearData,
        cycleYear: currYear,
        cycleStartYear
      });

      // Add up totals
      // const cycleStats = cycleData.stats;

      // cycleStats.fees += yearData.fees;
      // cycleStats.equitiesGrowth += yearData.equitiesGrowth;
      // cycleStats.dividendsGrowth += yearData.dividendsGrowth;
      // cycleStats.bondsGrowth += yearData.bondsGrowth;
      // cycleStats.balance.total += yearData.balanceEnd;
      // cycleStats.balance.totalInflAdj += yearData.balanceInfAdjEnd;
      // cycleStats.withdrawals.total += yearData.withdrawal;
      // cycleStats.withdrawals.totalInflAdj += yearData.withdrawalInfAdjust;

      // // Adjust min/max
      // if (!cycleStats.balance.min) {
      //   cycleStats.balance.min = {
      //     year: currYear,
      //     balance: yearData.balanceEnd,
      //     yearInflAdj: currYear,
      //     balanceInflAdj: yearData.balanceInfAdjEnd
      //   };
      // } else {
      //   if (yearData.balanceEnd < cycleStats.balance.min.balance) {
      //     cycleStats.balance.min.year = currYear;
      //     cycleStats.balance.min.balance = yearData.balanceEnd;
      //   }
      //   if (yearData.balanceInfAdjEnd < cycleStats.balance.min.balanceInflAdj) {
      //     cycleStats.balance.min.yearInflAdj = currYear;
      //     cycleStats.balance.min.balanceInflAdj = yearData.balanceInfAdjEnd;
      //   }
      // }
      // if (!cycleStats.balance.max) {
      //   cycleStats.balance.max = {
      //     year: currYear,
      //     balance: yearData.balanceEnd,
      //     yearInflAdj: currYear,
      //     balanceInflAdj: yearData.balanceInfAdjEnd
      //   };
      // } else {
      //   if (yearData.balanceEnd > cycleStats.balance.max.balance) {
      //     cycleStats.balance.max.year = currYear;
      //     cycleStats.balance.max.balance = yearData.balanceEnd;
      //   }
      //   if (yearData.balanceInfAdjEnd > cycleStats.balance.max.balanceInflAdj) {
      //     cycleStats.balance.max.yearInflAdj = currYear;
      //     cycleStats.balance.max.balanceInflAdj = yearData.balanceInfAdjEnd;
      //   }
      // }
      // if (!cycleStats.withdrawals.min) {
      //   cycleStats.withdrawals.min = {
      //     year: currYear,
      //     amount: yearData.withdrawal,
      //     yearInflAdj: currYear,
      //     amountInflAdj: yearData.withdrawalInfAdjust
      //   };
      // } else {
      //   if (yearData.withdrawal < cycleStats.withdrawals.min.amount) {
      //     cycleStats.withdrawals.min.year = currYear;
      //     cycleStats.withdrawals.min.amount = yearData.withdrawal;
      //   }
      //   if (
      //     yearData.withdrawalInfAdjust <
      //     cycleStats.withdrawals.min.amountInflAdj
      //   ) {
      //     cycleStats.withdrawals.min.yearInflAdj = currYear;
      //     cycleStats.withdrawals.min.amountInflAdj =
      //       yearData.withdrawalInfAdjust;
      //   }
      // }
      // if (!cycleStats.withdrawals.max) {
      //   cycleStats.withdrawals.max = {
      //     year: currYear,
      //     amount: yearData.withdrawal,
      //     yearInflAdj: currYear,
      //     amountInflAdj: yearData.withdrawalInfAdjust
      //   };
      // } else {
      //   if (yearData.withdrawal > cycleStats.withdrawals.max.amount) {
      //     cycleStats.withdrawals.max.year = currYear;
      //     cycleStats.withdrawals.max.amount = yearData.withdrawal;
      //   }
      //   if (
      //     yearData.withdrawalInfAdjust >
      //     cycleStats.withdrawals.max.amountInflAdj
      //   ) {
      //     cycleStats.withdrawals.max.yearInflAdj = currYear;
      //     cycleStats.withdrawals.max.amountInflAdj =
      //       yearData.withdrawalInfAdjust;
      //   }
      // }
      // if (cycleStats.failureYear === 0 && yearData.balanceEnd <= 0) {
      //   cycleStats.failureYear = currYear;
      // }
      // if (
      //   currYearIndex ===
      //   cycleStartYearIndex + this.options.simulationYearsLength - 1
      // ) {
      //   cycleStats.balance.ending = yearData.balanceEnd;
      //   cycleStats.balance.endingInflAdj = yearData.balanceInfAdjEnd;
      // }
    }
    // Calculate stats
    // const cycleStats = cycleData.stats;

    // cycleStats.balance.average =
    //   cycleStats.balance.total / this.options.simulationYearsLength;
    // cycleStats.balance.averageInflAdj =
    //   cycleStats.balance.totalInflAdj / this.options.simulationYearsLength;
    // cycleStats.withdrawals.average =
    //   cycleStats.withdrawals.total / this.options.simulationYearsLength;
    // cycleStats.withdrawals.averageInflAdj =
    //   cycleStats.withdrawals.totalInflAdj / this.options.simulationYearsLength;

    // cycleStats.balance.median = median(
    //   cycleData.yearData.map((yearData) => yearData.balanceEnd)
    // );
    // cycleStats.balance.medianInflAdj = median(
    //   cycleData.yearData.map((yearData) => yearData.balanceInfAdjEnd)
    // );
    // cycleStats.withdrawals.median = median(
    //   cycleData.yearData.map((yearData) => yearData.withdrawal)
    // );
    // cycleStats.withdrawals.medianInflAdj = median(
    //   cycleData.yearData.map((yearData) => yearData.withdrawalInfAdjust)
    // );

    return cycleData;
  }

  crunchAllPortfolioStats(portfolioLifecyclesData: CycleData[]): CycleStats[] {
    const portfolioYearDataColumns = pivotPortfolioCycles(
      portfolioLifecyclesData
    );
    return portfolioYearDataColumns.map((d) => this.crunchSingleCycleStats(d));
  }

  crunchSingleCycleStats(cycleYearDataColumns: YearDataColumns): CycleStats {
    const numYears = cycleYearDataColumns.balanceEnd.length;
    let stats = {
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
        endingInflAdj: cycleYearDataColumns.balanceInfAdjEnd[numYears - 1]
      },
      withdrawals: {
        total: sum(cycleYearDataColumns.withdrawal),
        totalInflAdj: sum(cycleYearDataColumns.withdrawalInfAdjust),
        average: mean(cycleYearDataColumns.withdrawal),
        averageInflAdj: mean(cycleYearDataColumns.withdrawalInfAdjust),
        median: median(cycleYearDataColumns.withdrawal),
        medianInflAdj: median(cycleYearDataColumns.withdrawalInfAdjust)
      },
      failureYear: 0
    } as CycleStats;

    return stats;
  }

  crunchSingleCycleData(): CycleData {
    return this.crunchCycle(this.marketYearData[0].year);
  }

  /**
   * Generate a portfolio lifecycle for every possible starting year.
   */
  crunchAllCyclesData(): {
    portfolioLifecyclesData: CycleData[];
    portfolioStats: PortfolioStats;
  } {
    const lastPossibleStartYear =
      this.marketYearData[this.marketYearData.length - 1].year -
      this.options.simulationYearsLength;

    const allCyclesData: CycleData[] = [];

    for (
      let cycleStartYear = this.marketYearData[0].year;
      cycleStartYear <= lastPossibleStartYear;
      cycleStartYear++
    ) {
      allCyclesData.push(this.crunchCycle(cycleStartYear));
    }

    return {
      portfolioLifecyclesData: allCyclesData,
      portfolioStats: {} as PortfolioStats //this.crunchPortfolioStats(allCyclesData)
    };
  }

  // crunchPortfolioStats(portfolioData: CycleData[]): PortfolioStats {
  //   const portfolioStats: PortfolioStats = {
  //     numFailures: 0,
  //     numSuccesses: 0,
  //     successRate: 0,
  //     investmentExpenses: {
  //       average: 0,
  //       median: 0
  //     },
  //     equitiesPriceChange: {
  //       average: 0,
  //       median: 0
  //     },
  //     equitiesDividendsPaid: {
  //       average: 0,
  //       median: 0
  //     },
  //     fixedIncomeInterestPaid: {
  //       average: 0,
  //       median: 0
  //     },
  //     balance: {
  //       average: 0,
  //       averageInflAdj: 0,
  //       median: 0,
  //       medianInflAdj: 0,
  //       min: {
  //         year: 0,
  //         balance: 0,
  //         yearInflAdj: 0,
  //         balanceInflAdj: 0
  //       },
  //       max: {
  //         year: 0,
  //         balance: 0,
  //         yearInflAdj: 0,
  //         balanceInflAdj: 0
  //       }
  //     },
  //     withdrawals: {
  //       average: 0,
  //       averageInflAdj: 0,
  //       median: 0,
  //       medianInflAdj: 0,
  //       min: {
  //         cycleStartYear: 0,
  //         yearInCycle: 0,
  //         amount: 0,
  //         cycleStartYearInflAdj: 0,
  //         yearInCycleInflAdj: 0,
  //         amountInflAdj: 0
  //       },
  //       max: {
  //         cycleStartYear: 0,
  //         yearInCycle: 0,
  //         amount: 0,
  //         cycleStartYearInflAdj: 0,
  //         yearInCycleInflAdj: 0,
  //         amountInflAdj: 0
  //       }
  //     }
  //   };

  //   const cycleDataStats = portfolioData.map((cycleData) => cycleData.stats);

  //   portfolioStats.numFailures = cycleDataStats
  //     .map((stats) => stats.failureYear)
  //     .reduce(
  //       (numFailures, failureYear) =>
  //         failureYear > 0 ? numFailures + 1 : numFailures,
  //       0
  //     );
  //   portfolioStats.numSuccesses =
  //     cycleDataStats.length - portfolioStats.numFailures;
  //   portfolioStats.successRate =
  //     portfolioStats.numSuccesses / cycleDataStats.length;

  //   const investmentExpenses = cycleDataStats.map((stats) => stats.fees);
  //   portfolioStats.investmentExpenses.average = mean(investmentExpenses);
  //   portfolioStats.investmentExpenses.median = median(investmentExpenses);

  //   const equitiesPriceChanges = cycleDataStats.map(
  //     (stats) => stats.equitiesGrowth
  //   );
  //   portfolioStats.equitiesPriceChange.average = mean(equitiesPriceChanges);
  //   portfolioStats.equitiesPriceChange.median = median(equitiesPriceChanges);

  //   const equitiesDividendsPaid = cycleDataStats.map(
  //     (stats) => stats.dividendsGrowth
  //   );
  //   portfolioStats.equitiesDividendsPaid.average = mean(equitiesDividendsPaid);
  //   portfolioStats.equitiesDividendsPaid.median = median(equitiesDividendsPaid);

  //   const fixedIncomeInterestPaid = cycleDataStats.map(
  //     (stats) => stats.bondsGrowth
  //   );
  //   portfolioStats.fixedIncomeInterestPaid.average = mean(
  //     fixedIncomeInterestPaid
  //   );
  //   portfolioStats.fixedIncomeInterestPaid.median = median(
  //     fixedIncomeInterestPaid
  //   );

  //   const balances = cycleDataStats.map((stats) => stats.balance.ending);
  //   portfolioStats.balance.average = mean(balances);
  //   portfolioStats.balance.median = median(balances);
  //   const balancesMin = min(balances);
  //   const balancesMax = max(balances);
  //   portfolioStats.balance.min.year =
  //     this.marketYearData[0].year + balancesMin.index;
  //   portfolioStats.balance.min.balance = balancesMin.value;
  //   portfolioStats.balance.max.year =
  //     this.marketYearData[0].year + balancesMax.index;
  //   portfolioStats.balance.max.balance = balancesMax.value;

  //   const balancesInflationAdjusted = cycleDataStats.map(
  //     (stats) => stats.balance.endingInflAdj
  //   );
  //   const balancesInflationAdjustedMin = min(balancesInflationAdjusted);
  //   const balancesInflationAdjustedMax = max(balancesInflationAdjusted);
  //   portfolioStats.balance.averageInflAdj = mean(balancesInflationAdjusted);
  //   portfolioStats.balance.medianInflAdj = median(balancesInflationAdjusted);
  //   portfolioStats.balance.min.yearInflAdj =
  //     this.marketYearData[0].year + balancesInflationAdjustedMin.index;
  //   portfolioStats.balance.min.balanceInflAdj =
  //     balancesInflationAdjustedMin.value;
  //   portfolioStats.balance.max.yearInflAdj =
  //     this.marketYearData[0].year + balancesInflationAdjustedMax.index;
  //   portfolioStats.balance.max.balanceInflAdj =
  //     balancesInflationAdjustedMax.value;

  //   portfolioStats.withdrawals.average = mean(
  //     cycleDataStats.map((stats) => stats.withdrawals.average)
  //   );

  //   portfolioStats.withdrawals.averageInflAdj = mean(
  //     cycleDataStats.map((stats) => stats.withdrawals.averageInflAdj)
  //   );

  //   // Median of medians doesn't work, just take the average of medians
  //   portfolioStats.withdrawals.median = mean(
  //     cycleDataStats.map((stats) => stats.withdrawals.median)
  //   );

  //   portfolioStats.withdrawals.medianInflAdj = mean(
  //     cycleDataStats.map((stats) => stats.withdrawals.medianInflAdj)
  //   );

  //   const withdrawalsMinsYears = cycleDataStats.map((stats, statIndex) => ({
  //     cycleStartYear: this.marketYearData[statIndex].year,
  //     yearInCycle: stats.withdrawals.min.year
  //   }));
  //   const withdrawalsMinsVals = cycleDataStats.map(
  //     (stats) => stats.withdrawals.min.amount
  //   );
  //   const withdrawalsMinsMin = min(withdrawalsMinsVals);

  //   portfolioStats.withdrawals.min.amount = withdrawalsMinsMin.value;
  //   portfolioStats.withdrawals.min.cycleStartYear =
  //     withdrawalsMinsYears[withdrawalsMinsMin.index].cycleStartYear;
  //   portfolioStats.withdrawals.min.yearInCycle =
  //     withdrawalsMinsYears[withdrawalsMinsMin.index].yearInCycle;

  //   const withdrawalsMinsInflAdjYears = cycleDataStats.map(
  //     (stats, statIndex) => ({
  //       cycleStartYear: this.marketYearData[statIndex].year,
  //       yearInCycle: stats.withdrawals.min.yearInflAdj
  //     })
  //   );
  //   const withdrawalsMinsInflAdjVals = cycleDataStats.map(
  //     (stats) => stats.withdrawals.min.amountInflAdj
  //   );
  //   const withdrawalsMinsInflAdjMin = min(withdrawalsMinsInflAdjVals);

  //   portfolioStats.withdrawals.min.amountInflAdj =
  //     withdrawalsMinsInflAdjMin.value;
  //   portfolioStats.withdrawals.min.cycleStartYearInflAdj =
  //     withdrawalsMinsInflAdjYears[
  //       withdrawalsMinsInflAdjMin.index
  //     ].cycleStartYear;
  //   portfolioStats.withdrawals.min.yearInCycleInflAdj =
  //     withdrawalsMinsInflAdjYears[withdrawalsMinsInflAdjMin.index].yearInCycle;

  //   const withdrawalsMaxesYears = cycleDataStats.map((stats, statIndex) => ({
  //     cycleStartYear: this.marketYearData[statIndex].year,
  //     yearInCycle: stats.withdrawals.max.year
  //   }));
  //   const withdrawalsMaxesVals = cycleDataStats.map(
  //     (stats) => stats.withdrawals.max.amount
  //   );
  //   const withdrawalsMaxesMax = max(withdrawalsMaxesVals);

  //   portfolioStats.withdrawals.max.amount = withdrawalsMaxesMax.value;
  //   portfolioStats.withdrawals.max.cycleStartYear =
  //     withdrawalsMaxesYears[withdrawalsMaxesMax.index].cycleStartYear;
  //   portfolioStats.withdrawals.max.yearInCycle =
  //     withdrawalsMaxesYears[withdrawalsMaxesMax.index].yearInCycle;

  //   const withdrawalsMaxesInflAdjYears = cycleDataStats.map(
  //     (stats, statIndex) => ({
  //       cycleStartYear: this.marketYearData[statIndex].year,
  //       yearInCycle: stats.withdrawals.max.yearInflAdj
  //     })
  //   );
  //   const withdrawalsMaxesInflAdjVals = cycleDataStats.map(
  //     (stats) => stats.withdrawals.max.amountInflAdj
  //   );
  //   const withdrawalsMaxesInflAdjMax = max(withdrawalsMaxesInflAdjVals);

  //   portfolioStats.withdrawals.max.amountInflAdj =
  //     withdrawalsMaxesInflAdjMax.value;
  //   portfolioStats.withdrawals.max.cycleStartYearInflAdj =
  //     withdrawalsMaxesInflAdjYears[
  //       withdrawalsMaxesInflAdjMax.index
  //     ].cycleStartYear;
  //   portfolioStats.withdrawals.max.yearInCycleInflAdj =
  //     withdrawalsMaxesInflAdjYears[
  //       withdrawalsMaxesInflAdjMax.index
  //     ].yearInCycle;

  //   return portfolioStats;
  // }

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
