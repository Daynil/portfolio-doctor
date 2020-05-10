import fs from 'fs';
import { CyclePortfolio, WithdrawalMethod } from './calc/portfolio-calc';

const portfolio = new CyclePortfolio({
  startBalance: 1000000,
  equitiesRatio: 0.9,
  investmentExpenseRatio: 0.0025,
  simulationYearsLength: 60,
  withdrawalMethod: WithdrawalMethod.PercentPortfolioClamped,
  withdrawal: { percentage: 0.04, floor: 30000, ceiling: 60000 }
});

const data = portfolio.crunchAllCyclesData();

const lineTerm = '\r\n';

const headerRow =
  'Year,CumulativeInflation,PortfolioStart,PortfolioInflAdjStart,ActualSpend,InflAdjSpend,Equities,Bonds,EquitiesGrowth,DividendsGrowth,BondsGrowth,Fees,PortfolioEnd,PortfolioInflAdjEnd' +
  lineTerm;

let csvString =
  'Assumptions:' +
  lineTerm +
  'Start Balance,' +
  portfolio.options.startBalance +
  lineTerm +
  'Equities Ratio,' +
  portfolio.options.equitiesRatio +
  lineTerm +
  'Investment Expense Ratio,' +
  portfolio.options.investmentExpenseRatio +
  lineTerm +
  'Simulation Years Length,' +
  portfolio.options.simulationYearsLength +
  lineTerm;

switch (portfolio.options.withdrawalMethod) {
  case WithdrawalMethod.Nominal:
    csvString +=
      'Withdrawal Method,Nominal' +
      lineTerm +
      'Withdrawal Amount,' +
      portfolio.options.withdrawal.staticAmount;
    break;
  case WithdrawalMethod.InflationAdjusted:
    csvString +=
      'Withdrawal Method,Inflation Adjusted' +
      lineTerm +
      'Withdrawal Amount,' +
      portfolio.options.withdrawal.staticAmount;
    break;
  case WithdrawalMethod.PercentPortfolio:
    csvString +=
      'Withdrawal Method,Percent of Portfolio (Inflation Adjusted)' +
      lineTerm +
      'Withdrawal Amount,' +
      portfolio.options.withdrawal.percentage;
    break;
  case WithdrawalMethod.PercentPortfolioClamped:
    csvString +=
      'Withdrawal Method,Percent of Portfolio (Inflation Adjusted)' +
      lineTerm +
      'Withdrawal Amount,' +
      portfolio.options.withdrawal.percentage +
      lineTerm +
      'Minimal Withdrawal (Inflation Adjusted),' +
      portfolio.options.withdrawal.floor +
      lineTerm +
      'Maximum Withdrawal (Inflation Adjusted),' +
      portfolio.options.withdrawal.ceiling;
    break;
  default:
    break;
}

csvString += lineTerm + lineTerm;

for (const cycle of data.portfolioLifecyclesData) {
  if (cycle.yearData[0].year > portfolio.options.startYear)
    csvString += lineTerm + lineTerm;
  csvString += headerRow;
  for (const yearData of cycle.yearData) {
    csvString += `${yearData.year},${yearData.cumulativeInflation},${yearData.balanceStart},${yearData.balanceInfAdjStart},${yearData.withdrawal},${yearData.withdrawalInfAdjust},${yearData.equities},${yearData.bonds},${yearData.equitiesGrowth},${yearData.dividendsGrowth},${yearData.bondsGrowth},${yearData.fees},${yearData.balanceEnd},${yearData.balanceInfAdjEnd}${lineTerm}`;
  }
}

csvString +=
  lineTerm +
  lineTerm +
  'Inflation adjusted end balances by cycle start date' +
  lineTerm +
  lineTerm +
  'Year,';

for (let i = 0; i < portfolio.getMaxSimulationCycles(); i++) {
  csvString += `${portfolio.options.startYear + i},`;
}

csvString += lineTerm;

for (let i = 0; i < portfolio.options.simulationYearsLength; i++) {
  csvString += `${i + 1},`;
  for (const cycle of data.portfolioLifecyclesData) {
    csvString += `${cycle.yearData[i].balanceInfAdjEnd},`;
  }
  csvString += lineTerm;
}

fs.writeFileSync('results.csv', csvString);
