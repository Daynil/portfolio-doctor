import { format } from 'd3-format';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  HistoricPortfolioDetails,
  PortfolioData
} from '../components/historic-portfolio-details';
import { MonteCarloPortfolioDetails } from '../components/monte-carlo-portfolio-details';
import RadioInput from '../components/radio-input';
import SEO from '../components/seo';
import TextInput from '../components/text-input';
import {
  CyclePortfolio,
  CycleYearData,
  generateMonteCarloRuns,
  getMaxSimulationCycles,
  getMaxSimulationLength,
  MarketDataStats,
  MarketYearData,
  PortfolioOptions,
  SimulationMethod,
  WithdrawalMethod
} from '../data/calc/portfolio-calc';
import { DatasetContext, defaultDatasetName } from '../data/data-context';
import { getMarketDataStats, parseCSVStringToJSON } from '../data/data-helpers';
import { parseStringyNum } from '../utilities/format';
import {
  defaultPortfolioOptions,
  queryStringToPortfolioOptions
} from '../utilities/util';

export default function Simulator() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(null);
  const [monteCarloRuns, setMonteCarloRuns] = useState<CycleYearData[][]>([]);
  const [marketData, setMarketData] = useState<MarketYearData[]>([]);
  const [marketDataStats, setMarketDataStats] = useState<MarketDataStats>(null);
  const [inputErr, setInputErr] = useState('');

  const refStartingBalance = useRef<HTMLInputElement>(null);
  const refStockRatio = useRef<HTMLInputElement>(null);
  const refExpenseRatio = useRef<HTMLInputElement>(null);
  const refWithdrawalAmount = useRef<HTMLInputElement>(null);
  const refWithdrawalPercent = useRef<HTMLInputElement>(null);
  const refWithdrawalMin = useRef<HTMLInputElement>(null);
  const refWithdrawalMax = useRef<HTMLInputElement>(null);
  const refSimLength = useRef<HTMLInputElement>(null);

  let startingOptions = { ...defaultPortfolioOptions };
  let urlOptionsValidated = false;

  // This is the global window.location
  // Next.js offers similar funtion with useRouter().query, but no point to refactor
  if (typeof location !== 'undefined' && location?.search) {
    [startingOptions, urlOptionsValidated] = queryStringToPortfolioOptions(
      location.search
    );
  }

  const [portfolioOptions, setPortfolioOptions] = useState<PortfolioOptions>(
    startingOptions
  );
  const [simulationMethod, setSimulationMethod] = useState<SimulationMethod>(
    startingOptions.simulationMethod
  );
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>(
    startingOptions.withdrawalMethod
  );

  const {
    preferredDataset,
    storedDatasets,
    defaultDatasetCSVStringCache
  } = useContext(DatasetContext);

  useEffect(() => {
    if (preferredDataset === defaultDatasetName) {
      if (defaultDatasetCSVStringCache) {
        const data = parseCSVStringToJSON(defaultDatasetCSVStringCache);
        setMarketData(data);
        setMarketDataStats(getMarketDataStats(data));
      }
    } else {
      const datasetString = storedDatasets.find(
        (d) => d.name === preferredDataset
      ).csvString;

      const data = parseCSVStringToJSON(datasetString);
      setMarketData(data);
      setMarketDataStats(getMarketDataStats(data));
    }
  }, [defaultDatasetCSVStringCache]);

  useEffect(() => {
    // Auto-trigger portfolio calculation if we have valid options in the URL
    if (urlOptionsValidated && marketData.length) calculatePortfolio();
  }, [marketData]);

  function calculatePortfolio() {
    let newPortfolioOptions = { ...defaultPortfolioOptions };

    switch (withdrawalMethod) {
      case WithdrawalMethod.InflationAdjusted:
        newPortfolioOptions.withdrawal.staticAmount = parseStringyNum(
          refWithdrawalAmount.current.value
        );
        break;

      case WithdrawalMethod.PercentPortfolio:
        newPortfolioOptions.withdrawal.percentage =
          parseFloat(refWithdrawalPercent.current.value) / 100;

        if (isNaN(newPortfolioOptions.withdrawal.percentage)) {
          setInputErr('Invalid value for withdrawal percent.');
          return;
        }
        break;

      case WithdrawalMethod.PercentPortfolioClamped:
        (newPortfolioOptions.withdrawal.percentage =
          parseFloat(refWithdrawalPercent.current.value) / 100),
          (newPortfolioOptions.withdrawal.floor = parseStringyNum(
            refWithdrawalMin.current.value
          ));
        newPortfolioOptions.withdrawal.ceiling = parseStringyNum(
          refWithdrawalMax.current.value
        );

        if (isNaN(newPortfolioOptions.withdrawal.percentage)) {
          setInputErr('Invalid value for withdrawal percent.');
          return;
        }
        break;
    }

    newPortfolioOptions.simulationMethod = simulationMethod;
    newPortfolioOptions.startBalance = parseStringyNum(
      refStartingBalance.current.value
    );
    newPortfolioOptions.equitiesRatio =
      parseFloat(refStockRatio.current.value) / 100;
    newPortfolioOptions.investmentExpenseRatio =
      parseFloat(refExpenseRatio.current.value) / 100;
    newPortfolioOptions.simulationYearsLength = parseInt(
      refSimLength.current.value
    );
    newPortfolioOptions.withdrawalMethod = withdrawalMethod;

    if (isNaN(newPortfolioOptions.equitiesRatio)) {
      setInputErr('Invalid value for withdrawal equities ratio.');
      return;
    } else if (newPortfolioOptions.equitiesRatio > 1) {
      setInputErr('Maximium equities ratio is 100%.');
      return;
    } else if (newPortfolioOptions.equitiesRatio < 0) {
      setInputErr('Minimum equities ratio is 0%.');
      return;
    } else if (isNaN(newPortfolioOptions.investmentExpenseRatio)) {
      setInputErr('Invalid value for withdrawal investment expense ratio.');
      return;
    } else if (newPortfolioOptions.investmentExpenseRatio > 1) {
      setInputErr('Maximium investment expense ratio is 100%.');
      return;
    } else if (newPortfolioOptions.investmentExpenseRatio < 0) {
      setInputErr('Minimum investment expense ratio is 0%.');
      return;
    } else if (
      newPortfolioOptions.simulationYearsLength >
      getMaxSimulationLength(marketData)
    ) {
      setInputErr(
        `Maximium simulation length is ${getMaxSimulationLength(
          marketData
        )} years.`
      );
      return;
    } else if (newPortfolioOptions.simulationYearsLength < 3) {
      setInputErr('Minimum simulation length is 3 years.');
      return;
    }

    setInputErr('');
    setPortfolioOptions(newPortfolioOptions);

    if (simulationMethod === 'Historical Data') {
      const curPortfolio = new CyclePortfolio(marketData, newPortfolioOptions);
      const lifecyclesData = curPortfolio.crunchAllCyclesData();
      const stats = curPortfolio.crunchAllPortfolioStats(lifecyclesData);

      // const blob = new Blob([JSON.stringify(portfolioData)], {
      //   type: 'application/json'
      // });
      // FileSaver.saveAs(blob, 'results.json');

      setPortfolio({
        lifecyclesData,
        lifecyclesStats: stats.cycleStats,
        portfolioStats: stats,
        options: curPortfolio.options
      });
    } else {
      const simsPerMarketData = getMaxSimulationCycles(
        marketData,
        newPortfolioOptions.simulationYearsLength
      );
      const desiredSimulations = 10000;
      const runsNeeded = Math.ceil(desiredSimulations / simsPerMarketData);

      const simulations = generateMonteCarloRuns(
        marketData,
        newPortfolioOptions,
        runsNeeded,
        marketDataStats
      );
      setMonteCarloRuns(simulations.data);
      console.log(simulations.data.length);
      console.log(simulations.failures);
      console.log(
        (simulations.data.length - simulations.failures) /
          simulations.data.length
      );
    }
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
            <TextInput
              symbolPrefix="$"
              className="pl-8 w-full"
              name="withdrawalAmount"
              type="text"
              defaultValue={format(',')(
                portfolioOptions.withdrawal.staticAmount
              )}
              ref={refWithdrawalAmount}
              onChange={(e) => handleIntegerInputChange(e, refWithdrawalAmount)}
            />
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
            <TextInput
              symbolSuffix="%"
              className="w-full"
              name="withdrawalPercent"
              type="text"
              defaultValue={portfolioOptions.withdrawal.percentage * 100}
              ref={refWithdrawalPercent}
            />
          </div>
        );
      case WithdrawalMethod.PercentPortfolioClamped:
        return (
          <div key={WithdrawalMethod.PercentPortfolioClamped}>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="withdrawalPercent">
                Withdrawal Percent
              </label>
              <TextInput
                symbolSuffix="%"
                className="w-full"
                name="withdrawalPercent"
                type="text"
                defaultValue={portfolioOptions.withdrawal.percentage * 100}
                ref={refWithdrawalPercent}
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="withdrawalMin">
                Withdrawal Minimum
              </label>
              <TextInput
                symbolPrefix="$"
                className="pl-8 w-full"
                name="withdrawalMin"
                type="text"
                defaultValue={format(',')(portfolioOptions.withdrawal.floor)}
                ref={refWithdrawalMin}
                onChange={(e) => handleIntegerInputChange(e, refWithdrawalMin)}
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="withdrawalMax">
                Withdrawal Maximum
              </label>
              <TextInput
                symbolPrefix="$"
                className="pl-8 w-full"
                name="withdrawalMax"
                type="text"
                defaultValue={format(',')(portfolioOptions.withdrawal.ceiling)}
                ref={refWithdrawalMax}
                onChange={(e) => handleIntegerInputChange(e, refWithdrawalMax)}
              />
            </div>
          </div>
        );

      default:
        break;
    }
  }

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

  function getPortfolioChart() {
    if (simulationMethod === 'Historical Data') {
      return !portfolio ? null : <HistoricPortfolioDetails {...portfolio} />;
    } else
      return !monteCarloRuns.length ? null : (
        <MonteCarloPortfolioDetails lifecyclesData={monteCarloRuns} />
      );
  }

  return (
    <div>
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
                    <RadioInput
                      id="historical"
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
                    <RadioInput
                      id="monteCarlo"
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
              {/* {simulationMethod === 'Historical Data' ? (
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
              ) : null} */}
            </div>

            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="startBalance">
                Starting Balance
              </label>
              <TextInput
                symbolPrefix="$"
                className="pl-8 w-full"
                name="startBalance"
                type="text"
                defaultValue={format(',')(portfolioOptions.startBalance)}
                ref={refStartingBalance}
                onChange={(e) =>
                  handleIntegerInputChange(e, refStartingBalance)
                }
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="equitiesRatio">
                Stock Ratio
              </label>
              <TextInput
                symbolSuffix="%"
                className="w-full"
                name="equitiesRatio"
                type="text"
                defaultValue={portfolioOptions.equitiesRatio * 100}
                ref={refStockRatio}
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="expenseRatio">
                Expense Ratio
              </label>
              <TextInput
                symbolSuffix="%"
                className="w-full"
                name="expenseRatio"
                type="text"
                defaultValue={portfolioOptions.investmentExpenseRatio * 100}
                ref={refExpenseRatio}
              />
            </div>
            <div className="text-gray-800 mt-4">
              <label className="form-label">Withdrawal Method</label>
              <div className="ml-2">
                <div className="flex items-center">
                  <RadioInput
                    id="fixed"
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
                  <RadioInput
                    id="percent"
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
                  <RadioInput
                    id="clamped"
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
              <TextInput
                name="simLength"
                type="number"
                defaultValue={portfolioOptions.simulationYearsLength}
                min={5}
                max={getMaxSimulationLength(marketData)}
                ref={refSimLength}
              />
            </div>
            <div className="flex w-full justify-between">
              <button
                className="btn btn-green mt-4"
                onClick={calculatePortfolio}
              >
                Calculate!
              </button>
            </div>
          </div>
          <div className="w-full">{getPortfolioChart()}</div>
        </div>
      </div>
    </div>
  );
}
