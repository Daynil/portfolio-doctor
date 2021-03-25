import { format as numFormat } from 'd3-format';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
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
  DepositInfo,
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
import {
  getMarketDataStats,
  getQuantiles,
  getQuantileStats,
  parseCSVStringToJSON
} from '../data/data-helpers';
import { parseStringyNum } from '../utilities/format';
import {
  defaultPortfolioOptions,
  queryStringToPortfolioOptions
} from '../utilities/util';

export default function Simulator() {
  const [depositModalActive, setDepositModalActive] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioData>(null);
  const [monteCarloRuns, setMonteCarloRuns] = useState<CycleYearData[][]>([]);
  const [marketData, setMarketData] = useState<MarketYearData[]>([]);
  const [marketDataStats, setMarketDataStats] = useState<MarketDataStats>(null);
  const [inputErr, setInputErr] = useState('');
  const [depositInputErr, setDepositInputErr] = useState('');

  const refStartingBalance = useRef<HTMLInputElement>(null);
  const refStockRatio = useRef<HTMLInputElement>(null);
  const refExpenseRatio = useRef<HTMLInputElement>(null);
  const refWithdrawalAmount = useRef<HTMLInputElement>(null);
  const refWithdrawalPercent = useRef<HTMLInputElement>(null);
  const refWithdrawalMin = useRef<HTMLInputElement>(null);
  const refWithdrawalMax = useRef<HTMLInputElement>(null);
  const refWithdrawalStart = useRef<HTMLInputElement>(null);
  const refSimLength = useRef<HTMLInputElement>(null);
  const refDepositAmount = useRef<HTMLInputElement>(null);
  const refDepositStart = useRef<HTMLInputElement>(null);
  const refDepositEnd = useRef<HTMLInputElement>(null);

  let parsedOptions = cloneDeep(defaultPortfolioOptions);
  let urlOptionsValidated = false;

  // This is the global window.location
  // Next.js offers similar funtion with useRouter().query, but no point to refactor
  if (typeof location !== 'undefined' && location?.search) {
    [parsedOptions, urlOptionsValidated] = queryStringToPortfolioOptions(
      location.search
    );
  }

  const [portfolioOptions, setPortfolioOptions] = useState<PortfolioOptions>(
    defaultPortfolioOptions
  );
  const [simulationMethod, setSimulationMethod] = useState<SimulationMethod>(
    defaultPortfolioOptions.simulationMethod
  );
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>(
    defaultPortfolioOptions.withdrawalMethod
  );
  const [delayWithdrawal, setDelayWithdrawal] = useState(false);
  const [deposits, setDeposits] = useState<DepositInfo[]>(
    defaultPortfolioOptions.deposits
  );

  // To avoid hydration issues, wait for after first render to change options if present
  useEffect(() => {
    if (!isEqual(defaultPortfolioOptions, parsedOptions)) {
      setPortfolioOptions(parsedOptions);
      setSimulationMethod(parsedOptions.simulationMethod);
      setWithdrawalMethod(parsedOptions.withdrawalMethod);
      setDelayWithdrawal(parsedOptions.withdrawal.startYearIdx > 1);
      setDeposits(parsedOptions.deposits);
    }
  }, []);

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
    // if (urlOptionsValidated && marketData.length) calculatePortfolio();
    // Always trigger calculation on landing once data is parsed
    if (marketData.length) calculatePortfolio();
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

    if (delayWithdrawal) {
      newPortfolioOptions.withdrawal.startYearIdx = parseInt(
        refWithdrawalStart.current.value
      );

      if (newPortfolioOptions.withdrawal.startYearIdx < 1) {
        setInputErr('Invalid withdrawal start.');
        return;
      }
    } else newPortfolioOptions.withdrawal.startYearIdx = 1;

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

    if (deposits.length) {
      newPortfolioOptions.deposits = deposits;
    } else {
      newPortfolioOptions.deposits = undefined;
    }

    setInputErr('');
    setPortfolioOptions(newPortfolioOptions);

    if (simulationMethod === 'Historical Data') {
      const curPortfolio = new CyclePortfolio(marketData, newPortfolioOptions);
      const lifecyclesData = curPortfolio.crunchAllCyclesData();
      const stats = curPortfolio.crunchAllPortfolioStats(lifecyclesData);
      const quantileLines = getQuantiles(lifecyclesData, [
        0.1,
        0.25,
        0.5,
        0.75,
        0.9
      ]);

      setPortfolio({
        lifecyclesData,
        lifecyclesStats: stats.cycleStats,
        portfolioStats: stats,
        quantiles: quantileLines,
        quantileStats: getQuantileStats(quantileLines),
        options: curPortfolio.options,
        marketData
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
              Amount
            </label>
            <TextInput
              symbolPrefix="$"
              className="pl-8 w-full"
              name="withdrawalAmount"
              type="text"
              defaultValue={numFormat(',')(
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
              Percent
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
                Percent
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
                Minimum
              </label>
              <TextInput
                symbolPrefix="$"
                className="pl-8 w-full"
                name="withdrawalMin"
                type="text"
                defaultValue={numFormat(',')(portfolioOptions.withdrawal.floor)}
                ref={refWithdrawalMin}
                onChange={(e) => handleIntegerInputChange(e, refWithdrawalMin)}
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="withdrawalMax">
                Maximum
              </label>
              <TextInput
                symbolPrefix="$"
                className="pl-8 w-full"
                name="withdrawalMax"
                type="text"
                defaultValue={numFormat(',')(
                  portfolioOptions.withdrawal.ceiling
                )}
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
      const num = numFormat(',')(parseStringyNum(input));
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

  function addDeposit() {
    setDepositModalActive(true);

    if (parseStringyNum(refDepositAmount.current.value) < 1) {
      setDepositInputErr('Invalid amount');
      return;
    }

    if (parseInt(refDepositStart.current.value) < 1) {
      setDepositInputErr('Invalid start year');
      return;
    }

    if (
      parseInt(refDepositStart.current.value) >
      parseInt(refDepositEnd.current.value)
    ) {
      setDepositInputErr('Deposit start year must be less than end year');
      return;
    }

    const newDeposits = [...deposits];
    newDeposits.push({
      amount: parseStringyNum(refDepositAmount.current.value),
      startYearIdx: parseInt(refDepositStart.current.value),
      endYearIdx: parseInt(refDepositEnd.current.value)
    });
    setDepositInputErr('');
    setDeposits(newDeposits);
    setDepositModalActive(false);
  }

  function removeDeposit(depositIdx: number) {
    const newDeposits = [...deposits];
    newDeposits.splice(depositIdx, 1);
    setDeposits(newDeposits);
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
        title="FI Portfolio Doctor Simulator"
        description="An app for projecting portfolio performance"
      />
      <div
        className={
          depositModalActive
            ? 'fixed inset-0 transition-opacity z-10'
            : 'hidden'
        }
        onClick={() => setDepositModalActive(false)}
      >
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
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
              {/* <div className="text-gray-800 mt-4">
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
              </div> */}
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
                defaultValue={numFormat(',')(portfolioOptions.startBalance)}
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
            <h3 className="text-base mt-6 tracking-wider text-gray-700 font-semibold border-solid border-b-2 border-gray-300">
              Withdrawals
            </h3>
            <div className="text-gray-800 mt-2">
              <label className="form-label">Method</label>
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
            <div className="flex flex-row items-center mt-5">
              <input
                type="checkbox"
                id="delayWithdrawal"
                className="text-green-500 focus:ring-green-400"
                checked={delayWithdrawal}
                onChange={() => setDelayWithdrawal(!delayWithdrawal)}
              />
              <label htmlFor="delayWithdrawal" className="ml-2 text-sm">
                Delay Withdrawal Start
              </label>
            </div>
            {delayWithdrawal && (
              <div className="flex flex-col mt-4">
                <label className="form-label" htmlFor="withdrawalDelayYears">
                  Start Withdrawls On (year)
                </label>
                <TextInput
                  name="withdrawalDelayYears"
                  type="number"
                  defaultValue={portfolioOptions.withdrawal.startYearIdx}
                  max={getMaxSimulationLength(marketData)}
                  ref={refWithdrawalStart}
                />
              </div>
            )}
            <h3 className="text-base mt-6 tracking-wider text-gray-700 font-semibold border-solid border-b-2 border-gray-300">
              Deposits
            </h3>
            <div className="flex flex-col mt-3">
              {!deposits.length ? (
                <div className="text-sm italic text-gray-400">No deposits</div>
              ) : (
                deposits.map((deposit, i) => (
                  <div className="flex items-center justify-around mt-4 border rounded-md border-gray-200 p-2">
                    <div className="flex items-center text-base">
                      <span className="text-base">
                        {numFormat('$,.0f')(deposit.amount)}
                      </span>
                      <div className="flex flex-col ml-6">
                        <div>Starting Year {deposit.startYearIdx}</div>
                        <div>Ending Year {deposit.endYearIdx}</div>
                      </div>
                    </div>
                    <button
                      className="font-bold text-red-500 hover:text-red-400 transition-colors duration-75"
                      onClick={() => removeDeposit(i)}
                    >
                      X
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex w-full justify-between mt-5">
              <button
                className="btn btn-gray text-sm tracking-wide"
                onClick={() => setDepositModalActive(true)}
              >
                Add Deposit
              </button>
            </div>
            <div className="flex w-full justify-between mt-12">
              <button
                className="btn btn-green tracking-wide"
                onClick={calculatePortfolio}
                disabled={!marketData.length}
              >
                Calculate!
              </button>
            </div>
          </div>
          <div
            className={
              depositModalActive
                ? 'absolute bg-white shadow-lg rounded-md text-base p-6 w-96 flex flex-col z-20'
                : 'hidden'
            }
          >
            <h1 className="text-2xl text-gray-600">Deposit</h1>
            <div className="h-px w-full -mt-5 mb-6 bg-gray-500"></div>
            {depositInputErr ? (
              <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 py-2 px-4 my-2"
                role="alert"
              >
                <p className="font-bold">Input Error</p>
                <p className="text-sm">{depositInputErr}</p>
              </div>
            ) : null}
            <div className="flex flex-col">
              <label className="form-label" htmlFor="depositAmount">
                Amount
              </label>
              <TextInput
                symbolPrefix="$"
                className="pl-8 w-full"
                name="depositAmount"
                type="text"
                defaultValue={numFormat(',')(1000)}
                ref={refDepositAmount}
                onChange={(e) => handleIntegerInputChange(e, refDepositAmount)}
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="startDeposits">
                Start On (year)
              </label>
              <TextInput
                name="startDeposits"
                type="number"
                defaultValue={1}
                min={1}
                ref={refDepositStart}
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="form-label" htmlFor="endDeposits">
                Stop On (year)
              </label>
              <TextInput
                name="endDeposits"
                type="number"
                defaultValue={5}
                min={1}
                ref={refDepositEnd}
              />
            </div>
            <div className="flex w-full justify-between mt-6">
              <button
                className="btn btn-green tracking-wide"
                onClick={() => addDeposit()}
              >
                Save
              </button>
            </div>
          </div>
          <div className="w-full">{getPortfolioChart()}</div>
        </div>
      </div>
    </div>
  );
}
