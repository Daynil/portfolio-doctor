//import parse from 'csv-parse';
//import { writeFileSync } from 'fs';
import { deviation } from 'd3';
import { mean } from 'd3-array';
import { normSinv } from '../utilities/math';
import { MarketDataStats, MarketYearData } from './calc/portfolio-calc';

export function loadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsBinaryString(file);
  });
}

/**
 * Take a CSV File with market data and parse it into JSON to cache data.
 *
 * CSV format columns:
 * Year: YYYY integer
 * Equities Price: float
 * Dividend Per Equity Share: float
 * Inflation Index: float
 * Fixed Income Interest: float
 *
 */
export async function parseCSVFileToJSON(
  srcCSV: File
): Promise<MarketYearData[]> {
  const csvString = await loadFile(srcCSV);
  return parseCSVStringToJSON(csvString, true);
}

// TODO: error handling here, mostly handling invalid string values
export function parseCSVStringToJSON(
  csvString: string,
  headers = true
): MarketYearData[] {
  const rows = csvString.split(/\r\n|\n|\r/);
  // Toss the header
  if (headers) rows.shift();
  const parsedRows = rows.map((row) => {
    const columns = row.split(/,/g);
    return {
      year: parseInt(columns[0]),
      equitiesPrice: parseFloat(columns[1]),
      equitiesDividend: parseFloat(columns[2]),
      inflationIndex: parseFloat(columns[3]),
      fixedIncomeInterest: parseFloat(columns[4])
    };
  });
  // Toss the trailing newline if it exists
  if (!parsedRows[parsedRows.length - 1].year) parsedRows.pop();
  return parsedRows;
}

/**
 * Get market fluctuation statistics across the dataset
 * @param marketYearData This will always be the default jan-shiller-data
 */
export function getMarketDataStats(
  marketYearData: MarketYearData[]
): MarketDataStats {
  let equitiesYearPcntChange: number[] = [];

  // Start at second year (can't get prev year in first year)
  for (let i = 1; i < marketYearData.length; i++) {
    const curYearEquitiesPrice = marketYearData[i].equitiesPrice;
    const prevYearEquitiesPrice = marketYearData[i - 1].equitiesPrice;
    equitiesYearPcntChange.push(
      (curYearEquitiesPrice - prevYearEquitiesPrice) / prevYearEquitiesPrice
    );
  }

  return {
    meanAnnualMarketChange: mean(equitiesYearPcntChange),
    stdDevAnnualMarketChange: deviation(equitiesYearPcntChange)
  };
}

/**
 * Perform Monte Carlo simulation and return simulated market year data.
 * Only the equities price is simulated.
 */
export function generateMonteCarloDataset(
  originalYearData: MarketYearData[],
  marketDataStats: MarketDataStats
): MarketYearData[] {
  const monteCarloYearData: MarketYearData[] = [];

  for (let i = 0; i < originalYearData.length; i++) {
    if (i === 0) {
      monteCarloYearData[i] = originalYearData[i];
    } else {
      const randomProbability = Math.random();
      const randomNumStdDevs = normSinv(randomProbability);
      const simulatedMarketChange =
        marketDataStats.meanAnnualMarketChange +
        randomNumStdDevs * marketDataStats.stdDevAnnualMarketChange;
      const priorYearEquitiesPrice = monteCarloYearData[i - 1].equitiesPrice;
      monteCarloYearData[i] = {
        ...originalYearData[i],
        equitiesPrice:
          priorYearEquitiesPrice +
          priorYearEquitiesPrice * simulatedMarketChange
      };
    }
  }

  return monteCarloYearData;
}

/**
 * Create a 3d array string of portfolio data for exportation
 */
// export function generatePortfolioArrayString(data: CycleData[]): string {
//   //let headerRow: string;

//   // For testing, match csv header to our object names, otherwise prettify them for simpler export reading
//   // if (forTesting) {
//   //   headerRow =
//   //     'cycleYear,cycleStartYear,cumulativeInflation,balanceStart,balanceInfAdjStart,withdrawal,withdrawalInfAdjust,startSubtotal,equities,equitiesGrowth,dividendsGrowth,bonds,bondsGrowth,endSubtotal,fees,balanceEnd,balanceInfAdjEnd' +
//   //     lineTerm;
//   // } else {
//   //   headerRow =
//   //     'Year,CumulativeInflation,PortfolioStart,PortfolioInflAdjStart,ActualSpend,InflAdjSpend,Equities,Bonds,EquitiesGrowth,DividendsGrowth,BondsGrowth,Fees,PortfolioEnd,PortfolioInflAdjEnd' +
//   //     lineTerm;
//   // }

//   let arrString = '[';
//   const dataArr3d = portfolioObjToArr3d(data);

//   for (const cycle of dataArr3d) {
//     arrString += '[';
//     for (const row of cycle) {
//       arrString += '[';
//       for (const col of row) {
//         arrString += col + ',';
//       }
//       // Remove trailing comma and close
//       arrString = arrString.substr(0, arrString.length - 1) + '],';
//     }
//     // Remove trailing comma and close
//     arrString = arrString.substr(0, arrString.length - 1) + '],';
//   }
//   // Remove trailing comma and close
//   arrString = arrString.substr(0, arrString.length - 1) + ']';

//   console.log(arrString);
//   return arrString;
// }

// TODO: this should take actual portfolio data to write rather than crunching it within the function.
/**
 * Create a CSV export of portfolio data for easy viewing of full data.
 * @param data Portfolio data to write out.
 * @param destCSVPath Destination path.
 */
// export function writeResultsToCSV(
//   data: {
//     portfolioLifecyclesData: CycleData[];
//     portfolioStats: PortfolioStats;
//   },
//   destCSVPath: string
// ) {
//   const portfolio = new CyclePortfolio({
//     startBalance: 1000000,
//     equitiesRatio: 0.9,
//     investmentExpenseRatio: 0.0025,
//     simulationYearsLength: 60,
//     withdrawalMethod: WithdrawalMethod.PercentPortfolioClamped,
//     withdrawal: { percentage: 0.04, floor: 30000, ceiling: 60000 }
//   });

//   data = portfolio.crunchAllCyclesData();

//   const lineTerm = '\r\n';

//   const headerRow =
//     'Year,CumulativeInflation,PortfolioStart,PortfolioInflAdjStart,ActualSpend,InflAdjSpend,Equities,Bonds,EquitiesGrowth,DividendsGrowth,BondsGrowth,Fees,PortfolioEnd,PortfolioInflAdjEnd' +
//     lineTerm;

//   let csvString =
//     'Assumptions:' +
//     lineTerm +
//     'Start Balance,' +
//     portfolio.options.startBalance +
//     lineTerm +
//     'Equities Ratio,' +
//     portfolio.options.equitiesRatio +
//     lineTerm +
//     'Investment Expense Ratio,' +
//     portfolio.options.investmentExpenseRatio +
//     lineTerm +
//     'Simulation Years Length,' +
//     portfolio.options.simulationYearsLength +
//     lineTerm;

//   switch (portfolio.options.withdrawalMethod) {
//     case WithdrawalMethod.Nominal:
//       csvString +=
//         'Withdrawal Method,Nominal' +
//         lineTerm +
//         'Withdrawal Amount,' +
//         portfolio.options.withdrawal.staticAmount;
//       break;
//     case WithdrawalMethod.InflationAdjusted:
//       csvString +=
//         'Withdrawal Method,Inflation Adjusted' +
//         lineTerm +
//         'Withdrawal Amount,' +
//         portfolio.options.withdrawal.staticAmount;
//       break;
//     case WithdrawalMethod.PercentPortfolio:
//       csvString +=
//         'Withdrawal Method,Percent of Portfolio (Inflation Adjusted)' +
//         lineTerm +
//         'Withdrawal Amount,' +
//         portfolio.options.withdrawal.percentage;
//       break;
//     case WithdrawalMethod.PercentPortfolioClamped:
//       csvString +=
//         'Withdrawal Method,Percent of Portfolio (Inflation Adjusted)' +
//         lineTerm +
//         'Withdrawal Amount,' +
//         portfolio.options.withdrawal.percentage +
//         lineTerm +
//         'Minimal Withdrawal (Inflation Adjusted),' +
//         portfolio.options.withdrawal.floor +
//         lineTerm +
//         'Maximum Withdrawal (Inflation Adjusted),' +
//         portfolio.options.withdrawal.ceiling;
//       break;
//     default:
//       break;
//   }

//   csvString += lineTerm + lineTerm;

//   for (const cycle of data.portfolioLifecyclesData) {
//     if (cycle.yearData[0].year > portfolio.options.startYear)
//       csvString += lineTerm + lineTerm;
//     csvString += headerRow;
//     for (const yearData of cycle.yearData) {
//       csvString += `${yearData.year},${yearData.cumulativeInflation},${yearData.balanceStart},${yearData.balanceInfAdjStart},${yearData.withdrawal},${yearData.withdrawalInfAdjust},${yearData.equities},${yearData.bonds},${yearData.equitiesGrowth},${yearData.dividendsGrowth},${yearData.bondsGrowth},${yearData.fees},${yearData.balanceEnd},${yearData.balanceInfAdjEnd}${lineTerm}`;
//     }
//   }

//   csvString +=
//     lineTerm +
//     lineTerm +
//     'Inflation adjusted end balances by cycle start date' +
//     lineTerm +
//     lineTerm +
//     'Year,';

//   for (let i = 0; i < portfolio.getMaxSimulationCycles(); i++) {
//     csvString += `${portfolio.options.startYear + i},`;
//   }

//   csvString += lineTerm;

//   for (let i = 0; i < portfolio.options.simulationYearsLength; i++) {
//     csvString += `${i + 1},`;
//     for (const cycle of data.portfolioLifecyclesData) {
//       csvString += `${cycle.yearData[i].balanceInfAdjEnd},`;
//     }
//     csvString += lineTerm;
//   }

//   //writeFileSync('results.csv', csvString);
//   writeFileSync(destCSVPath, csvString);
// }

// Old version of parser for posterity, was loading in all month data into separate datasets in a hash
// import parse from 'csv-parse';
// import { createReadStream, writeFileSync } from 'fs';
// import { MarketYearData } from './calc/portfolio-calc';

// const parser = parse({ from: 2 });

// const jsonData: {
//   [month: string]: MarketYearData[];
// } = {} as any;

// createReadStream('data.csv')
//   .pipe(parser)
//   .on('data', (row: string[]) => {
//     const date = row[0];
//     const year = date.split('.')[0];
//     let month = date.split('.')[1];

//     if (month === '1') month = '10';
//     if (month.substr(0, 1) === '0') month = month.substr(1, 1);

//     if (!jsonData[month]) jsonData[month] = [];

//     jsonData[month].push({
//       year: parseInt(year),
//       price: parseFloat(row[1]),
//       dividend: parseFloat(row[2]),
//       cpi: parseFloat(row[3]),
//       fixedIncomeInterest: parseFloat(row[4])
//     });
//   })
//   .on('end', () => {
//     for (const month in jsonData) {
//       if (jsonData.hasOwnProperty(month)) {
//         const yearData = jsonData[month];
//         yearData.sort((a, b) => a.year - b.year);
//       }
//     }
//     writeFileSync('data.json', JSON.stringify(jsonData));
//   });
