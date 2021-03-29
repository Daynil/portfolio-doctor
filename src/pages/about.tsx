import React from 'react';
import SEO from '../components/seo';
import TextLink from '../components/text-link';
import { baseUrl } from '../utilities/constants';

// TODO: create a nav section for this page and a way to link to each (so I can link from simulator too)

const aboutContents = [
  { depth: 1, text: 'How It Works' },
  { depth: 1, text: 'Portfolio Risk Management' },
  { depth: 1, text: 'What about Inflation' },
  { depth: 1, text: 'Historical Data Used' },
  { depth: 1, text: 'How to Use' },
  { depth: 2, text: 'Expense Ratio' },
  { depth: 2, text: 'Simulation Length' },
  { depth: 2, text: 'Withdrawals' },
  { depth: 2, text: 'Withdrawal Delays and Deposits' },
  { depth: 2, text: 'Results' },
  { depth: 1, text: 'Share, Save, Download' }
];
function getTitleLink(title: string) {
  title = title.split(' ').join('-');
  title = title.split(',').join('');
  return title;
}
export default function About() {
  function tableOfContents() {
    return aboutContents.map((item) => {
      const depthClass = item.depth > 1 ? `ml-${2 * item.depth}` : '';
      return (
        <a
          key={item.text}
          href={`${baseUrl}/about#${getTitleLink(item.text)}`}
          className={depthClass}
        >
          {item.text}
        </a>
      );
    });
  }
  function getLinkHeader(idx: number) {
    const item = aboutContents[idx];
    return item.depth === 1 ? (
      <h2 id={getTitleLink(item.text)}>{item.text}</h2>
    ) : (
      <h3 id={getTitleLink(item.text)} className="text-lg font-semibold mb-2">
        {item.text}
      </h3>
    );
  }
  function headerLink() {}
  return (
    <div>
      <SEO
        title="About - FI Portfolio Doctor"
        description="An app for projecting portfolio performance"
      />
      <div className="inline-flex flex-col">{tableOfContents()}</div>
      <h1 className="mt-20 text-center">About FI Portfolio Doctor</h1>
      <p className="mt-14">
        Hi! I'm <TextLink href="https://dlibin.net/">Danny Libin</TextLink>, and
        I built this app to help me understand the mechanics behind using a
        portfolio to fund financial independence and retirement. I wanted clean,
        interactive way to view my results, and the ability to iterate on
        various scenarios quickly and easily.
      </p>
      <p>
        Financial independence (FI) is the point at which your current annual
        expenditure can reasonably be supported by your current savings nest egg
        for the rest of your life (or indefinitely). In other words, you can
        retire if you choose to do so, regardless of your age (as in FIRE -
        Financially Independent Retired Early).
      </p>
      <p>
        The concept behind this simulator is to determine the success rate
        (Health! 👨‍⚕️) of your portfolio in retirement, on the basis of the
        available historical data of U.S. stock market and bonds performance. A
        healthy portfolio should be able to weather most of the worst case
        scenarios experienced in the history of the market.
      </p>
      {getLinkHeader(0)}
      <blockquote className="mx-4 py-2 px-4 border-l-4 border-green-500 mb-6">
        <p className="mb-4">
          Past performance is no guarantee of future results.
        </p>
        <i>—Everyone Ever</i>
      </blockquote>
      <p>
        If we're using historical data to determine our success rates, and we
        know past performance is no guarentee of future results, how does this
        even work?!
      </p>
      <p>
        When it comes to any stock market simulation, especially in the long
        term, we can't expect any sort of guarantees. The name of the game is
        risk management, which is where the historical data comes in.
      </p>
      <p>
        This simulator takes all available historical data and runs the length
        of your full retirement across various different retirement start dates.
        The questions we're answering are:
      </p>
      <ul>
        <li>
          What would happen if I had retired right before the{' '}
          <TextLink href="https://en.wikipedia.org/wiki/Great_Depression">
            Great Depression
          </TextLink>
          ?
        </li>
        <li>
          What about if I had experienced the{' '}
          <TextLink href="https://en.wikipedia.org/wiki/Dot-com_bubble">
            Dot-com bubble
          </TextLink>{' '}
          during my retirement?
        </li>
        <li>How often would my portfolio fail in these situations?</li>
        <li>
          How often would I end up with a massive surplus at the end of my life?
        </li>
      </ul>
      {getLinkHeader(1)}
      <p>
        Regardless of how many retirement cycles we simulate, we can never
        eliminate risk completely. However, we can develop a familiarity with
        the various methods we have at our disposal for risk management.
      </p>
      <p>
        The{' '}
        <TextLink href="https://en.wikipedia.org/wiki/Trinity_study">
          Trinity study
        </TextLink>{' '}
        famously produced the concept known as the "safe withdrawal rate". They
        used a similar simulation to determine the maximum withdrawal rate that
        avoids most portfolio failures during a 30 year period. This produced
        the "4% rule", which became a useful rule of thumb for retirement
        simulation. So if you had a $1M portfolio, you could safely withdrawal
        4%, $40,000, annually with minimal risk of portfolio failure.
      </p>
      <p>
        However, things get a bit dicier for early retirees. The longer you
        expand the time horizon of the simulation, the less certain you can be
        of the results, which you can see by the gradual divergence of the
        portfolio ending balances in this simulator.
      </p>
      <p>Luckily, we have plenty of options to manage risk:</p>
      <ul>
        <li>Start with a higher portfolio (the obvious choice...)</li>
        <li>Delay your retirement</li>
        <li>Reduce your withdrawal percentage</li>
        <li>
          Adjust your annual withdrawals based on market performance rather than
          continuously withdrawing the same (inflation-adjusted) amount
        </li>
        <li>
          Produce any kind of income throughout retirement to reduce withdrawals
          or even continue depositing
        </li>
      </ul>
      <p>
        A healthy portfolio is really a combination of the portfolio itself and
        the withdrawal strategy.
      </p>
      {getLinkHeader(2)}
      <p>
        Over a long time horizon, inflation is an extremely important
        consideration in simulations and it is easy to underestimate.
      </p>
      <p>
        There are several ways to track inflation. FI Portfolio Doctor measures
        it by tracking the{' '}
        <TextLink href="https://en.wikipedia.org/wiki/Consumer_price_index">
          consumer price index (CPI)
        </TextLink>
        . In short, CPI tracks the average price of a basket of consumer goods
        and services purchased by households, such as food, housing,
        transportation, etc. The magnitude of change in the average cost of this
        basket measures inflation.
      </p>
      <p>
        We can illustrate the importance of inflation-adjustment with an
        example. If you had started retirement in 1942 and your money grew to a
        nominal value of $328,974,040 by 2001, your inflation-adjusted value
        would be "just" $29,496,8164! In other words, you need to account for
        inflation or you won't have a good understanding of the actual
        purchasing power of your dollars over a long time horizon.
      </p>
      <p>
        By default, all values in FI Portfolio Doctor are adjusted for
        inflation. However, you can uncheck the inflation-adjustment checkbox
        for fun to see some really high numbers.
      </p>
      {getLinkHeader(3)}
      <p>
        The historical data used in FI Porftolio Doctor is compiled by{' '}
        <TextLink href="http://www.econ.yale.edu/~shiller/data.htm">
          Robert Shiller
        </TextLink>
        , a Nobel Laureate. Dividends and earnings data before 1926 are from{' '}
        <TextLink href="https://cowles.yale.edu/sites/default/files/files/pub/mon/m03-2-all.pdf">
          Crowles and associates
        </TextLink>
        . After 1926,{' '}
        <TextLink href="https://en.wikipedia.org/wiki/S%26P_500">
          S&P index data
        </TextLink>{' '}
        is used.
      </p>
      <h3 className="text-lg font-semibold mb-2">
        What about international data? I'm globally diversified!
      </h3>
      <p>
        US market data is the most robust available, especially going back as
        far as Shiller's data does, so that's what FI Portfolio Doctor uses.
        However, global diversification would actually produce a reduced asset
        correlation, and thus has the potential to produce equal or better
        results with less risk (according to{' '}
        <TextLink href="https://en.wikipedia.org/wiki/Modern_portfolio_theory">
          modern portfolio theory
        </TextLink>
        ). As such, if you're efficiently globally diversified, particularly
        among less correlated asset classes (emerging markets, etc), your actual
        portfolio may well do better than those based strictly on US data, at
        least in terms of volatility.
      </p>
      {getLinkHeader(4)}
      <p>
        I designed FI Portfolio doctor as a way to iterate on various scenarious
        quickly, and to view the details of each run interactively with details.
      </p>
      <p>
        On the left side are your portfolio inputs. Each time you adjust any
        inputs, just press "Calculate!" and the results data will refresh.
      </p>
      {getLinkHeader(5)}
      <p>
        The expense ratio of your portfolio may vary depending on the way you
        invest. If you're using mutual funds, it may be as high as 1%. If you're
        using straight{' '}
        <TextLink href="https://investor.vanguard.com/mutual-funds/profile/vtsax">
          Vanguard index funds
        </TextLink>
        , it may be as low as 0.04%. Personally, I use{' '}
        <TextLink href="https://www.betterment.com/">Betterment</TextLink>,
        which charges 0.25% in exchange for automating global diversification
        according to{' '}
        <TextLink href="https://en.wikipedia.org/wiki/Modern_portfolio_theory">
          modern portfolio theory
        </TextLink>
        .
      </p>
      {getLinkHeader(6)}
      <p>
        Adjust this number for the planned length of your retirement. The longer
        the retirement length, the fewer cycles we can run against the available
        historical data. If you're an early retiree, this number might be
        something like 60 years, which allows for 90 different simulated cycles
        of retirement (as of 2021).
      </p>
      {getLinkHeader(7)}
      <p>
        Other than your starting balance, your withdrawal strategy can make the
        biggest impact on your portfolio's health, and there are many
        strategies.
      </p>
      <p>
        <b className="text-base font-bold">Fixed -</b> The{' '}
        <TextLink href="https://en.wikipedia.org/wiki/William_Bengen">
          4% rule
        </TextLink>{' '}
        is a popular guideline to start with. According to this guideline , if
        you withdraw a fixed 4% of your starting portfolio, adjusted for
        inflation, you have a high chance of success across a range of
        scenarios. So, if your starting portfolio is $1M, you would withdrawl
        $40,000 inflation-adjusted dollars annually for the duration of your
        retirement.
      </p>
      <p>
        <b className="text-base font-bold">Percent of Portfolio -</b> Another
        option to is to dynamically adjust your portfolio based on market
        performance. In other words, the better the market does, the more you
        withdraw, and vice versa.
      </p>
      <p>
        This withdrawal method is the the safest - you won't find a single
        failure in any scenario! This is because you can only ever spend a
        fraction of your portfolio. You also have the potential to spend the
        most with this method - as your portfolio grows, so does your spending.
        However, if you have no way to support very low spend years, this method
        isn't as practical.
      </p>
      <p>
        <b className="text-base font-bold">Clamped Percent of Portfolio -</b> My
        favorite plan for retirement spending is a hybrid of the above two
        rules, a{' '}
        <TextLink href="https://advisors.vanguard.com/insights/article/spendingguidelinestohelpeaseretireesmarketworries">
          dynamic spending
        </TextLink>{' '}
        approach. With this method, you set a ceiling and a floor for spending
        each year, and allow market performance to dictate where your spending
        falls on the scale. This way, you don't have to worry about withdrawals
        below your minimum projected expenses, but you can also spend more on
        good years than you would with a fixed strategy. This reduces the odds
        of failure as well as reducing the odds of having an enormous nest egg
        late in your life.
      </p>
      <p>
        If you're not happy with your portfolio health, try tinkering with your
        minimum spend to get a feel for how much spending flexibility can help.
        Even small reductions in the minimum can cause dramatic improvements.
        See the difference a{' '}
        <TextLink
          href={`${baseUrl}/simulator?equitiesRatio=0.9&investmentExpenseRatio=0.0025&simulationMethod=Historical%20Data&simulationYearsLength=60&startBalance=1000000&withdrawalCeiling=60000&withdrawalFloor=40000&withdrawalMethod=3&withdrawalPercent=0.04&withdrawalStartIdx=1`}
        >
          $40,000
        </TextLink>{' '}
        and a{' '}
        <TextLink
          href={`${baseUrl}/simulator?equitiesRatio=0.9&investmentExpenseRatio=0.0025&simulationMethod=Historical%20Data&simulationYearsLength=60&startBalance=1000000&withdrawalCeiling=60000&withdrawalFloor=30000&withdrawalMethod=3&withdrawalPercent=0.04&withdrawalStartIdx=1`}
        >
          $30,000
        </TextLink>{' '}
        minimum spend can have? Neat!
      </p>
      {getLinkHeader(8)}
      <p>
        You can further fine tune your inputs by specifying a period to delay
        withdrawls. If you are nearing retirement and are not happy with your
        portfolio health at your given inputs, you can try delaying retirement
        for a few years to see how much closer it can get you.
      </p>
      <p>
        Additionally, you can account for deposits you know you'll be making the
        future. Perhaps you're expecting to collect Social Security 10 years
        into your retirement, or perhaps you know you'll have some income from a
        side-gig or part-time work.
      </p>
      <p>
        If you want to have a bit of fun, you can even use it as an investment
        calculator by{' '}
        <TextLink
          href={`${baseUrl}/simulator?deposits=%5B%7B%22amount%22%3A2400%2C%22startYearIdx%22%3A1%2C%22endYearIdx%22%3A60%7D%5D&equitiesRatio=0.9&investmentExpenseRatio=0.0025&simulationMethod=Historical%20Data&simulationYearsLength=60&startBalance=100000&withdrawalMethod=1&withdrawalStartIdx=100&withdrawalStaticAmount=40000`}
        >
          delaying withdrawals indefinitely and setting periodic
        </TextLink>{' '}
        deposits instead! This gives you a more realistic range of possible
        results based on historical data rather than the static percent most
        investment calculators use.
      </p>
      {getLinkHeader(9)}
      <p>
        On the right, you'll see the results of your current simulation, which
        includes a graph and various statistics.
      </p>
      <p>
        <b className="text-base font-bold">All Cycles View -</b> In this view,
        you'll see detailed lines in the graph which show each simulated cycle's
        portfolio ending balance based on your inputs. Hover and click around on
        the graph to view the details of each cycle and year.
      </p>
      <p>
        A table with the selected cycle's view shows up below the graph, which
        shows you ending balances, withdrawals, deposits, as well as notable
        events during each period. If you're interested in a cycle starting on a
        particular year (say, right before the great depression), you can select
        it in the blank table (while no other cycle is selected).
      </p>
      <p>
        <b className="text-base font-bold">Zoom Cycle View -</b> Some of the
        lower and median balance cycles are a bit dwarfed by the cycles that did
        exceedingly well (hurray for compounding interest! 💸) so it is hard to
        see the minutia. To remedy this, select he cycle you want to drill down
        to and select the "Zoom Cycle" view.
      </p>
      <p>
        <b className="text-base font-bold">Quantiles View -</b> This view will
        give you a bird's eye view of each portfolio's performance that's a bit
        cleaner, but less detailed than the all cycles view. 80% of cycles lie
        between the top and bottom lines (90th and 10th percentiles). The middle
        line is the "median" case (50th percentile).
      </p>
      <p>
        <b className="text-base font-bold">Portfolio Health -</b> This is
        ultimately the most important section, the health of your portfolio, as
        diagnosed by FI Portfolio Doctor 👨‍⚕️! If the large majority of the
        simulations end in success, you can consider your inputs able to
        accomidate most historical circumstances.
      </p>
      <p>
        Don't forget to consider the amount of cycles with low ending balances
        (inflation-adjusted ending balance less than half the original balance)
        and high ending balances (inflation-adjusted ending balance more than 3
        times the original balance). If enough of your balances end precariously
        low, you may want to consider tweaking your inputs to be a bit safer.
        Likewise, if you have many very high ending balances and you'd rather
        use your money during your lifespan, you can consider being more liberal
        with your spending.
      </p>
      {getLinkHeader(10)}
      <p>
        You can share, save, and download all of your results right from the
        results screen.
      </p>
      <p>
        Press the share button to generate a link which contains all of your
        input parameters. You can either share this with anyone else to show off
        your portfolio run, or you can save the link or bookmark it for future
        reference and rerun it any time by clicking the link or pasting it into
        the browser.
      </p>
      <p>
        If you want to see the details behind the cycles and calculations made
        in the simulation, you can click download, which returns a CSV file with
        all of the data.
      </p>
    </div>
  );
}
