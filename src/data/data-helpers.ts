//import parse from 'csv-parse';
//import { writeFileSync } from 'fs';
import {
  ascending,
  deviation,
  leastIndex,
  max,
  maxIndex,
  mean,
  min,
  quantile,
  transpose
} from 'd3';
import cloneDeep from 'lodash.clonedeep';
import {
  LinePointCoords,
  PlanePointCoords
} from '../components/charts/lines-chart';
import { normSinv } from '../utilities/math';
import {
  CycleYearData,
  CycleYearQuantile,
  MarketDataStats,
  MarketYearData
} from './calc/portfolio-calc';

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
  { meanAnnualMarketChange, stdDevAnnualMarketChange }: MarketDataStats
): MarketYearData[] {
  const monteCarloYearData: MarketYearData[] = [];

  for (let i = 0; i < originalYearData.length; i++) {
    if (i === 0) {
      monteCarloYearData[i] = originalYearData[i];
    } else {
      // Geometric Brownian Motion
      const drift =
        meanAnnualMarketChange -
        (stdDevAnnualMarketChange * stdDevAnnualMarketChange) / 2;
      const randomShock = stdDevAnnualMarketChange * normSinv(Math.random());

      const priorYearEquitiesPrice = monteCarloYearData[i - 1].equitiesPrice;
      const simulatedPrice =
        priorYearEquitiesPrice * Math.exp(drift + randomShock);

      monteCarloYearData[i] = {
        ...originalYearData[i],
        equitiesPrice: simulatedPrice
      };

      // Alternate Method
      // const randomProbability = Math.random();
      // const randomNumStdDevs = normSinv(randomProbability);
      // const simulatedMarketChange =
      //   meanAnnualMarketChange + randomNumStdDevs * stdDevAnnualMarketChange;
      // const priorYearEquitiesPrice = monteCarloYearData[i - 1].equitiesPrice;
      // monteCarloYearData[i] = {
      //   ...originalYearData[i],
      //   equitiesPrice:
      //     priorYearEquitiesPrice +
      //     priorYearEquitiesPrice * simulatedMarketChange
      // };
    }
  }

  return monteCarloYearData;
}

export function getQuantiles(
  yearData: CycleYearData[][],
  quantiles: number[]
): CycleYearQuantile[][] {
  const transposed = transpose<CycleYearData>(yearData).map((cycleData) =>
    cycleData.map((year) => year.balanceInfAdjEnd).sort(ascending)
  );
  const quantileData: CycleYearQuantile[][] = [];
  for (let i = 0; i < quantiles.length; i++) {
    const quantileNum = quantiles[i];
    quantileData.push(
      transposed.map((transposedYears, yearIdx) => {
        return {
          quantile: quantileNum,
          cycleYearIndex: yearIdx,
          balance: quantile(transposedYears, quantileNum)
        };
      })
    );
  }
  return quantileData;
}

export function sortLeftMostThenLongestLine<T>(
  series: T[][],
  xAccessor: (d: T) => number
): T[][] {
  const lines = cloneDeep(series);
  return lines.sort((lineA, lineB) => {
    if (xAccessor(lineA[0]) < xAccessor(lineB[0])) {
      // Leftmost point sorted first
      return -1;
    } else if (xAccessor(lineA[0]) > xAccessor(lineB[0])) {
      return 1;
    } else {
      if (lineA.length > lineB.length) {
        // If lines have equal first, longest sorted first
        return -1;
      } else if (lineA.length < lineB.length) {
        return 1;
      }
      // If lines have equal first and equal length, doesn't matter
      return 1;
    }
  });
}

/**
 * Filter for only longest line at each leftness
 * @param sortedLines sorted by left most then longest
 */
export function getLongestLineOfEachLeftness<T>(
  sortedLines: T[][],
  xAccessor: (d: T) => number
): T[][] {
  const lines: T[][] = [];

  let currLeftness = 0;
  let currLeftnessAddressed = false;
  for (let i = 0; i < sortedLines.length; i++) {
    const currLine = sortedLines[i];
    const nextLine = sortedLines[i + 1];
    currLeftness = xAccessor(currLine[0]);

    if (!nextLine) {
      if (currLeftnessAddressed) break;
      else {
        lines.push(currLine);
        break;
      }
    }

    if (!currLeftnessAddressed) {
      lines.push(currLine);
      currLeftnessAddressed = true;
    }

    // Reset for next loop
    if (xAccessor(nextLine[0]) !== currLeftness) currLeftnessAddressed = false;
  }

  return lines;
}

/**
 * Take a list of lines and get the full comparator line.
 * If there is no line that spans the entire range,
 * create one by stitching together the smaller ones.
 *
 * Assumes all lines have continuous data points.
 * Can't think of a good reason not to assume this.
 */
export function getFullContinuousLine<T>(
  series: T[][],
  xAccessor: (d: T) => number
): T[] {
  const sortedLines = sortLeftMostThenLongestLine(series, xAccessor);

  const lines = getLongestLineOfEachLeftness(sortedLines, xAccessor);

  const seriesExtent = getSeriesDomainExtent(lines, xAccessor);
  const longestLine = lines[maxIndex(lines, (line) => line.length)];

  let fullContinuousLine: T[] = [];

  // Longest line already spans series extent
  if (
    xAccessor(longestLine[0]) === seriesExtent.min &&
    xAccessor(longestLine[longestLine.length - 1]) === seriesExtent.max
  ) {
    return fullContinuousLine.concat(longestLine);
  }

  let fullLineCurrMax = 0;
  let currLineIdx = 0;
  do {
    if (currLineIdx === 0) {
      fullContinuousLine = fullContinuousLine.concat(lines[currLineIdx]);
    } else {
      const currLine = lines[currLineIdx];
      const currLineMax = max(currLine, xAccessor);
      // If the current line's max leftness is lower than the current full line max
      // We don't care about it
      if (currLineMax > fullLineCurrMax) {
        const newSection = currLine.filter(
          (point) => xAccessor(point) > fullLineCurrMax
        );
        fullContinuousLine = fullContinuousLine.concat(newSection);
      }
    }
    currLineIdx++;
    fullLineCurrMax = max(fullContinuousLine, xAccessor);
  } while (fullLineCurrMax !== seriesExtent.max);

  return fullContinuousLine;
}

/**
 * Determine the amount each line is shifted from the left
 * of the origin.
 */
export function getLeftOffsets<T>(series: T[][], xAccessor: (d: T) => number) {
  const lines = cloneDeep(series);
  const longestLine = getFullContinuousLine(lines, xAccessor);

  const leftOffsets: number[] = [];

  // Determine how far right shifted each line is
  for (let i = 0; i < lines.length; i++) {
    leftOffsets.push(
      longestLine.findIndex(
        (point) => xAccessor(point) === xAccessor(lines[i][0])
      )
    );
  }

  return leftOffsets;
}

/**
 * Among a list of lines, find the line coordinates closest to a
 * given plane point coordinate
 */
export function getClosestCoordinates<T>(
  planeCoords: PlanePointCoords,
  series: T[][],
  xAccessor: (d: T) => number,
  yAccessor: (d: T) => number,
  fullContinuousLine?: T[],
  lineLeftOffsets?: number[]
): LinePointCoords {
  if (!fullContinuousLine)
    fullContinuousLine = getFullContinuousLine(series, xAccessor);
  if (!lineLeftOffsets) lineLeftOffsets = getLeftOffsets(series, xAccessor);

  const closestXIndex = leastIndex(
    fullContinuousLine,
    (a, b) =>
      Math.abs(xAccessor(a) - planeCoords.x) -
      Math.abs(xAccessor(b) - planeCoords.x)
  );

  let shortestDistance = Infinity;
  let closestLineIndex = 0;
  for (let i = 0; i < series.length; i++) {
    const line = series[i];
    const lineLeftOffset = lineLeftOffsets[i];
    /*
     * Skip any lines whose left offset is greater than
     * the identified closest x index
     * e.g. if left offset is 2, but closest x index is 1, skip
     */
    const rightShiftedPastX = lineLeftOffset > closestXIndex;
    /*
     * Skip any lines that don't have any more values
     * at the given x index
     * e.g. if closest x index is 5 but line length is 3
     */
    const leftShiftedBeforeX = closestXIndex - lineLeftOffset > line.length - 1;
    if (rightShiftedPastX || leftShiftedBeforeX) continue;
    const distance = Math.abs(
      yAccessor(line[closestXIndex - lineLeftOffset]) - planeCoords.y
    );
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestLineIndex = i;
    }
  }

  return {
    lineIndex: closestLineIndex,
    xIndex: closestXIndex - lineLeftOffsets[closestLineIndex]
  };
}

/**
 * For lines shorter than the longest, fill nulls.
 * Nulls are positioned based on longest line x position
 */
export function getNullFilledLines<T>(
  series: T[][],
  xAccessor: (d: T) => number
): T[][] {
  const lines = cloneDeep(series);
  const longestLine = getFullContinuousLine(lines, xAccessor);

  const nullFilledLines: T[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const nullFilledLine: T[] = [];

    // Determine where to start filling nulls
    // based on how far right shifted current line is
    const indexOfStart = longestLine.findIndex(
      (point) => xAccessor(point) === xAccessor(line[0])
    );
    let nullsCounter = 0;
    // Fill nulls on both ends where neede
    for (let x = 0; x < longestLine.length; x++) {
      if (x < indexOfStart || x > line.length + nullsCounter - 1) {
        nullsCounter++;
        nullFilledLine.push(null);
      } else nullFilledLine.push(line[x - nullsCounter]);
    }
    nullFilledLines.push(nullFilledLine);
  }
  return nullFilledLines;
}

export function getSeriesDomainExtent<T>(
  series: T[][],
  xAccessor: (d: T) => number
) {
  return {
    min: min(series, (line) => min(line.map((d) => xAccessor(d)))),
    max: max(series, (line) => max(line.map((d) => xAccessor(d))))
  };
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
