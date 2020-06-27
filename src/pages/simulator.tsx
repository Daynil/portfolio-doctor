import React, { useContext, useEffect, useRef, useState } from 'react';
import Layout, { DatasetContext } from '../components/layout';
import { PortfolioData, PortfolioGraph } from '../components/portfolio-graph';
import SEO from '../components/seo';
import {
  CyclePortfolio,
  getMaxSimulationLength,
  MarketYearData,
  PortfolioOptions,
  WithdrawalMethod,
  WithdrawalOptions
} from '../data/calc/portfolio-calc';
import { parseCSVStringToJSON } from '../data/data-helpers';
import {
  commaNumToNum,
  numToCommaNum,
  numToCurrency
} from '../utilities/format';

type Props = {
  path: string;
};

export default function Simulator({ path }: Props) {
  const [portfolio, setPortfolio] = useState<PortfolioData>(null);
  const [data, setData] = useState<MarketYearData[]>([]);
  const [inputErr, setInputErr] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>(
    WithdrawalMethod.InflationAdjusted
  );
  const refStartingBalance = useRef<HTMLInputElement>(null);
  const refStockRatio = useRef<HTMLInputElement>(null);
  const refExpenseRatio = useRef<HTMLInputElement>(null);
  const refWithdrawalAmount = useRef<HTMLInputElement>(null);
  const refWithdrawalPercent = useRef<HTMLInputElement>(null);
  const refWithdrawalMin = useRef<HTMLInputElement>(null);
  const refWithdrawalMax = useRef<HTMLInputElement>(null);
  const refSimLength = useRef<HTMLInputElement>(null);

  const { preferredDataset, storedDatasetPaths } = useContext(DatasetContext);
  const datasetPath = storedDatasetPaths.find(
    (d) => d.datasetName === preferredDataset
  ).datasetPath;

  useEffect(() => {
    const getData = async () => {
      const csvString = await (await fetch(datasetPath)).text();
      setData(parseCSVStringToJSON(csvString));
    };
    getData();
  }, [datasetPath]);

  function calculatePortfolio() {
    let withdrawal: WithdrawalOptions;
    switch (withdrawalMethod) {
      case WithdrawalMethod.InflationAdjusted:
        withdrawal = {
          staticAmount: commaNumToNum(refWithdrawalAmount.current.value)
        };
        break;
      case WithdrawalMethod.PercentPortfolio:
        withdrawal = {
          percentage: parseFloat(refWithdrawalPercent.current.value) / 100
        };
        if (isNaN(withdrawal.percentage)) {
          setInputErr('Invalid value for withdrawal percent.');
          return;
        }
        break;
      case WithdrawalMethod.PercentPortfolioClamped:
        withdrawal = {
          percentage: parseFloat(refWithdrawalPercent.current.value) / 100,
          floor: commaNumToNum(refWithdrawalMin.current.value),
          ceiling: commaNumToNum(refWithdrawalMax.current.value)
        };
        if (isNaN(withdrawal.percentage)) {
          setInputErr('Invalid value for withdrawal percent.');
          return;
        }
        break;
    }

    const portfolioOptions: PortfolioOptions = {
      startBalance: commaNumToNum(refStartingBalance.current.value),
      equitiesRatio: parseFloat(refStockRatio.current.value) / 100,
      investmentExpenseRatio: parseFloat(refExpenseRatio.current.value) / 100,
      simulationYearsLength: parseInt(refSimLength.current.value),
      withdrawalMethod,
      withdrawal
    };

    if (isNaN(portfolioOptions.equitiesRatio)) {
      setInputErr('Invalid value for withdrawal equities ratio.');
      return;
    } else if (portfolioOptions.equitiesRatio > 1) {
      setInputErr('Maximium equities ratio is 100%.');
      return;
    } else if (portfolioOptions.equitiesRatio < 0) {
      setInputErr('Minimum equities ratio is 0%.');
      return;
    } else if (isNaN(portfolioOptions.investmentExpenseRatio)) {
      setInputErr('Invalid value for withdrawal investment expense ratio.');
      return;
    } else if (portfolioOptions.investmentExpenseRatio > 1) {
      setInputErr('Maximium investment expense ratio is 100%.');
      return;
    } else if (portfolioOptions.investmentExpenseRatio < 0) {
      setInputErr('Minimum investment expense ratio is 0%.');
      return;
    } else if (
      portfolioOptions.simulationYearsLength > getMaxSimulationLength(data)
    ) {
      setInputErr(
        `Maximium simulation length is ${getMaxSimulationLength(data)} years.`
      );
      return;
    } else if (portfolioOptions.simulationYearsLength < 5) {
      setInputErr('Minimum simulation length is 5 years.');
      return;
    }

    setInputErr('');

    const curPortfolio = new CyclePortfolio(data, portfolioOptions);
    const portfolioData = curPortfolio.crunchAllCyclesData();
    setPortfolio({
      lifecyclesData: portfolioData.portfolioLifecyclesData,
      stats: portfolioData.portfolioStats,
      options: curPortfolio.options,
      startYear: data[0].year
    });
  }

  function getWithdrawalInputs(): JSX.Element {
    switch (withdrawalMethod) {
      case WithdrawalMethod.InflationAdjusted:
        return (
          <div
            key={WithdrawalMethod.InflationAdjusted}
            className="flex flex-col mt-4"
          >
            <label className="form-label" htmlFor="withdrawalAmount">
              Withdrawal Amount
            </label>
            <div className="relative">
              <span className="absolute pointer-events-none inset-y-0 left-0 pl-4 flex items-center text-gray-600 font-medium">
                $
              </span>
              <input
                className="form-input pl-8 w-full"
                name="withdrawalAmount"
                type="text"
                defaultValue={numToCommaNum(40000)}
                ref={refWithdrawalAmount}
                onChange={(e) =>
                  handleIntegerInputChange(e, refWithdrawalAmount)
                }
              />
            </div>
          </div>
        );
      case WithdrawalMethod.PercentPortfolio:
        return (
          <div
            key={WithdrawalMethod.PercentPortfolio}
            className="flex flex-col mt-4"
          >
            <label className="form-label" htmlFor="withdrawalPercent">
              Withdrawal Percent
            </label>
            <div className="relative">
              <input
                className="form-input w-full"
                name="withdrawalPercent"
                type="text"
                defaultValue={4}
                ref={refWithdrawalPercent}
              />
              <span className="absolute pointer-events-none inset-y-0 right-0 pr-4 flex items-center text-gray-600 font-medium">
                %
              </span>
            </div>
          </div>
        );
      case WithdrawalMethod.PercentPortfolioClamped:
        return (
          <div key={WithdrawalMethod.PercentPortfolioClamped}>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="withdrawalPercent">
                Withdrawal Percent
              </label>
              <div className="relative">
                <input
                  className="form-input w-full"
                  name="withdrawalPercent"
                  type="text"
                  defaultValue={4}
                  ref={refWithdrawalPercent}
                />
                <span className="absolute pointer-events-none inset-y-0 right-0 pr-4 flex items-center text-gray-600 font-medium">
                  %
                </span>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="withdrawalMin">
                Withdrawal Minimum
              </label>
              <div className="relative">
                <span className="absolute pointer-events-none inset-y-0 left-0 pl-4 flex items-center text-gray-600 font-medium">
                  $
                </span>
                <input
                  className="form-input pl-8 w-full"
                  name="withdrawalMin"
                  type="text"
                  defaultValue={numToCommaNum(30000)}
                  ref={refWithdrawalMin}
                  onChange={(e) =>
                    handleIntegerInputChange(e, refWithdrawalMin)
                  }
                />
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="withdrawalMax">
                Withdrawal Maximum
              </label>
              <div className="relative">
                <span className="absolute pointer-events-none inset-y-0 left-0 pl-4 flex items-center text-gray-600 font-medium">
                  $
                </span>
                <input
                  className="form-input pl-8 w-full"
                  name="withdrawalMax"
                  type="text"
                  defaultValue={numToCommaNum(60000)}
                  ref={refWithdrawalMax}
                  onChange={(e) =>
                    handleIntegerInputChange(e, refWithdrawalMax)
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        break;
    }
  }

  const yearEndBalances = !portfolio
    ? null
    : portfolio.lifecyclesData[0].yearData.map((yearData) => {
        return (
          <tr key={yearData.year.toString()}>
            <td>{yearData.year}</td>
            <td>{numToCurrency(yearData.balanceInfAdjEnd)}</td>
          </tr>
        );
      });

  function handleIntegerInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
    refEl: React.MutableRefObject<HTMLInputElement>
  ) {
    e.preventDefault();
    const input = e.target.value;
    try {
      const num = numToCommaNum(commaNumToNum(input));
      refEl.current.value = num;
    } catch (e) {
      if ((e as Error).message !== undefined) {
        if (e.message === 'Not a number') {
          refEl.current.value = '0';
          return;
        }
      }
      throw e;
    }
  }

  return (
    <Layout path={path}>
      <SEO
        title="Portfolio Doctor Simulator"
        description="An app for projecting portfolio performance"
      />
      <div className="mt-10">
        <div className="flex justify-around">
          <div
            className="overflow-y-auto overflow-x-auto max-h-screen p-4 sticky top-0 border-r-2"
            style={{ minWidth: '300px' }}
          >
            <h2 className="text-lg text-gray-700 font-semibold tracking-wider border-solid border-b-2 border-green-500 mt-0">
              Portfolio Info
            </h2>
            {inputErr ? (
              <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 py-2 px-4 mt-4"
                role="alert"
              >
                <p className="font-bold">Input Error</p>
                <p className="text-sm">{inputErr}</p>
              </div>
            ) : null}
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="startBalance">
                Starting Balance
              </label>
              <div className="relative">
                <span className="absolute pointer-events-none inset-y-0 left-0 pl-4 flex items-center text-gray-600 font-medium">
                  $
                </span>
                <input
                  className="form-input pl-8 w-full"
                  name="startBalance"
                  type="text"
                  defaultValue={numToCommaNum(1000000)}
                  ref={refStartingBalance}
                  onChange={(e) =>
                    handleIntegerInputChange(e, refStartingBalance)
                  }
                />
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="equitiesRatio">
                Stock Ratio
              </label>
              <div className="relative">
                <input
                  className="form-input w-full"
                  name="equitiesRatio"
                  type="text"
                  defaultValue={90}
                  ref={refStockRatio}
                />
                <span className="absolute pointer-events-none inset-y-0 right-0 pr-4 flex items-center text-gray-600 font-medium">
                  %
                </span>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="expenseRatio">
                Expense Ratio
              </label>
              <div className="relative">
                <input
                  className="form-input w-full"
                  name="expenseRatio"
                  type="text"
                  defaultValue={0.25}
                  ref={refExpenseRatio}
                />
                <span className="absolute pointer-events-none inset-y-0 right-0 pr-4 flex items-center text-gray-600 font-medium">
                  %
                </span>
              </div>
            </div>
            <div className="text-gray-800 mt-4">
              <label className="form-label">Withdrawal Method</label>
              <div className="ml-2">
                <div className="flex items-center">
                  <input
                    id="fixed"
                    className="form-radio text-green-500"
                    type="radio"
                    name="withdrawalMethod"
                    checked={
                      withdrawalMethod === WithdrawalMethod.InflationAdjusted
                    }
                    onClick={() =>
                      setWithdrawalMethod(WithdrawalMethod.InflationAdjusted)
                    }
                  />
                  <label className="ml-2 text-sm" htmlFor="fixed">
                    Fixed
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="percent"
                    className="form-radio text-green-500"
                    type="radio"
                    name="withdrawalMethod"
                    checked={
                      withdrawalMethod === WithdrawalMethod.PercentPortfolio
                    }
                    onClick={() =>
                      setWithdrawalMethod(WithdrawalMethod.PercentPortfolio)
                    }
                  />
                  <label className="ml-2 text-sm" htmlFor="percent">
                    % of Portfolio
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="clamped"
                    className="form-radio text-green-500"
                    type="radio"
                    name="withdrawalMethod"
                    checked={
                      withdrawalMethod ===
                      WithdrawalMethod.PercentPortfolioClamped
                    }
                    onClick={() =>
                      setWithdrawalMethod(
                        WithdrawalMethod.PercentPortfolioClamped
                      )
                    }
                  />
                  <label className="ml-2 text-sm" htmlFor="clamped">
                    Clamped % of Portfolio
                  </label>
                </div>
              </div>
            </div>
            {getWithdrawalInputs()}
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="simLength">
                Simulation Length (years)
              </label>
              <input
                name="simLength"
                className="form-input"
                type="number"
                defaultValue={60}
                min={5}
                max={getMaxSimulationLength(data)}
                ref={refSimLength}
              />
            </div>
            <button className="btn btn-green mt-4" onClick={calculatePortfolio}>
              Calculate!
            </button>
          </div>
          <div className="w-full">
            {!portfolio ? null : <PortfolioGraph {...portfolio} />}
          </div>
        </div>
        {/* <table className="dataTable">
        <tr>
          <th>Year</th>
          <th>Ending Balance</th>
        </tr>
        {yearEndBalances}
      </table> */}
      </div>
    </Layout>
  );
}
