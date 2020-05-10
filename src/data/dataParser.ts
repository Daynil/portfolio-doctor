import parse from 'csv-parse';
import { createReadStream, writeFileSync } from 'fs';
import { MarketYearData } from './calc/portfolio-calc';

const parser = parse({ from: 2 });

const jsonData: {
  [month: string]: MarketYearData[];
} = {} as any;

createReadStream('data.csv')
  .pipe(parser)
  .on('data', (row: string[]) => {
    const date = row[0];
    const year = date.split('.')[0];
    let month = date.split('.')[1];

    if (month === '1') month = '10';
    if (month.substr(0, 1) === '0') month = month.substr(1, 1);

    if (!jsonData[month]) jsonData[month] = [];

    jsonData[month].push({
      year: parseInt(year),
      price: parseFloat(row[1]),
      dividend: parseFloat(row[2]),
      cpi: parseFloat(row[3]),
      fixedIncomeInterest: parseFloat(row[4])
    });
  })
  .on('end', () => {
    for (const month in jsonData) {
      if (jsonData.hasOwnProperty(month)) {
        const yearData = jsonData[month];
        yearData.sort((a, b) => a.year - b.year);
      }
    }
    writeFileSync('data.json', JSON.stringify(jsonData));
  });
