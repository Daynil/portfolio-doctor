import { format } from 'd3-format';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Layout from '../components/layout';
import { PortfolioData, PortfolioGraph } from '../components/portfolio-graph';
import SEO from '../components/seo';
import TextLink from '../components/text-link';
import {
  CyclePortfolio,
  getMaxSimulationLength,
  MarketYearData,
  PortfolioOptions,
  SimulationMethod,
  WithdrawalMethod,
  WithdrawalOptions
} from '../data/calc/portfolio-calc';
import { DatasetContext, defaultDatasetName } from '../data/data-context';
import { parseCSVStringToJSON } from '../data/data-helpers';
import { parseStringyNum } from '../utilities/format';

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
  const [simulationMethod, setSimulationMethod] = useState<SimulationMethod>(
    'Historical Data'
  );

  const refStartingBalance = useRef<HTMLInputElement>(null);
  const refStockRatio = useRef<HTMLInputElement>(null);
  const refExpenseRatio = useRef<HTMLInputElement>(null);
  const refWithdrawalAmount = useRef<HTMLInputElement>(null);
  const refWithdrawalPercent = useRef<HTMLInputElement>(null);
  const refWithdrawalMin = useRef<HTMLInputElement>(null);
  const refWithdrawalMax = useRef<HTMLInputElement>(null);
  const refSimLength = useRef<HTMLInputElement>(null);

  const {
    preferredDataset,
    storedDatasets,
    defaultDatasetCSVStringCache
  } = useContext(DatasetContext);

  useEffect(() => {
    if (preferredDataset === defaultDatasetName) {
      if (defaultDatasetCSVStringCache)
        setData(parseCSVStringToJSON(defaultDatasetCSVStringCache));
    } else {
      const datasetString = storedDatasets.find(
        (d) => d.name === preferredDataset
      ).csvString;

      setData(parseCSVStringToJSON(datasetString));
    }
  }, [defaultDatasetCSVStringCache]);

  function calculatePortfolio() {
    let withdrawal: WithdrawalOptions;
    switch (withdrawalMethod) {
      case WithdrawalMethod.InflationAdjusted:
        withdrawal = {
          staticAmount: parseStringyNum(refWithdrawalAmount.current.value)
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
          floor: parseStringyNum(refWithdrawalMin.current.value),
          ceiling: parseStringyNum(refWithdrawalMax.current.value)
        };
        if (isNaN(withdrawal.percentage)) {
          setInputErr('Invalid value for withdrawal percent.');
          return;
        }
        break;
    }

    const portfolioOptions: PortfolioOptions = {
      startBalance: parseStringyNum(refStartingBalance.current.value),
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
    } else if (portfolioOptions.simulationYearsLength < 3) {
      setInputErr('Minimum simulation length is 3 years.');
      return;
    }

    setInputErr('');

    const curPortfolio = new CyclePortfolio(data, portfolioOptions);
    const lifecyclesData = curPortfolio.crunchAllCyclesData();
    const stats = curPortfolio.crunchAllPortfolioStats(lifecyclesData);

    // const blob = new Blob([JSON.stringify(portfolioData)], {
    //   type: 'application/json'
    // });
    // FileSaver.saveAs(blob, 'results.json');

    setPortfolio({
      lifecyclesData,
      stats,
      chartData: lifecyclesData.map((cycle, i) => {
        return {
          startYear: data[0].year + i,
          values: cycle.map((year, i) => ({
            x: i,
            y: year.balanceInfAdjEnd,
            withdrawal: year.withdrawalInfAdjust
          })),
          stats: stats.cycleStats[i]
        };
      }),
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
                defaultValue={format(',')(40000)}
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
                  defaultValue={format(',')(30000)}
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
                  defaultValue={format(',')(60000)}
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
    : portfolio.lifecyclesData[0].map((yearData) => {
        return (
          <tr key={yearData.cycleYear.toString()}>
            <td>{yearData.cycleYear}</td>
            <td>{format('$.2f')(yearData.balanceInfAdjEnd)}</td>
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
      const num = format(',')(parseStringyNum(input));
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
              <div className="text-gray-800 mt-4">
                <label className="form-label">Simulation Method</label>
                <div className="ml-2">
                  <div className="flex items-center">
                    <input
                      id="historical"
                      className="form-radio text-green-500"
                      type="radio"
                      name="simulationMethod"
                      checked={simulationMethod === 'Historical Data'}
                      value="Historical Data"
                      onChange={(e) => {
                        setSimulationMethod(e.target.value as SimulationMethod);
                      }}
                    />
                    <label className="ml-2 text-sm" htmlFor="historical">
                      Historical Data
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="monteCarlo"
                      className="form-radio text-green-500"
                      type="radio"
                      name="simulationMethod"
                      checked={simulationMethod === 'Monte Carlo'}
                      value="Monte Carlo"
                      onChange={(e) => {
                        setSimulationMethod(e.target.value as SimulationMethod);
                      }}
                    />
                    <label className="ml-2 text-sm" htmlFor="monteCarlo">
                      Monte Carlo
                    </label>
                  </div>
                </div>
              </div>
              {simulationMethod === 'Historical Data' ? (
                <div className="flex flex-col mt-4 mb-2">
                  <label className="form-label">Currently Active Dataset</label>
                  <div className="text-base">
                    <TextLink
                      href="/upload-data/"
                      title="Upload or Change Dataset"
                    >
                      {preferredDataset}
                    </TextLink>
                  </div>
                </div>
              ) : null}
            </div>

            {/* <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="simulationMethod">
                Simulation Method
              </label>
              <div className="inline-block relative w-full">
                <select
                  className="block appearance-none w-full text-base bg-gray-200 shdow border border-gray-400 hover:border-green-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                  style={{ WebkitAppearance: 'none' }}
                  name="simulationMethod"
                  onChange={(e) =>
                    setSimulationMethod(e.target.value as SimulationMethod)
                  }
                >
                  <option>Historical Data</option>
                  <option>Monte Carlo</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {simulationMethod === 'Historical Data' ? (
                <div className="flex flex-col mt-4 mb-2">
                  <label className="form-label">Currently Active Dataset</label>
                  <div className="text-base">
                    <TextLink
                      href="/upload-data/"
                      title="Upload or Change Dataset"
                    >
                      {preferredDataset}
                    </TextLink>
                  </div>
                </div>
              ) : null}
            </div> */}
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
                  defaultValue={format(',')(1000000)}
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
                    value={WithdrawalMethod.InflationAdjusted}
                    onChange={(e) => {
                      setWithdrawalMethod(
                        parseInt(e.target.value) as WithdrawalMethod
                      );
                    }}
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
                    value={WithdrawalMethod.PercentPortfolio}
                    onChange={(e) => {
                      setWithdrawalMethod(
                        parseInt(e.target.value) as WithdrawalMethod
                      );
                    }}
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
                    value={WithdrawalMethod.PercentPortfolioClamped}
                    onChange={(e) => {
                      setWithdrawalMethod(
                        parseInt(e.target.value) as WithdrawalMethod
                      );
                    }}
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
