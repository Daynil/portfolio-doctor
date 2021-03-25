import React from 'react';
import SEO from '../components/seo';
import TextLink from '../components/text-link';

export default function About() {
  return (
    <div>
      <SEO
        title="About - FI Portfolio Doctor"
        description="An app for projecting portfolio performance"
      />
      <h1 className="mt-20 text-center">About FI Portfolio Doctor</h1>
      <p>
        Financial independence (FI) is the point at which your current annual
        expenditure can reasonably be supported by your current savings nest
        egg. In other words, you can retire if you choose to do so, regardless
        of your age.
      </p>
      <p>
        The concept behind this simulator is to determine the success rate
        (Health! 👨‍⚕️) of your portfolio in retirement, on the basis of the
        available historical data of U.S. stock market and bonds performance. A
        healthy portfolio should be able to weather most of the worst case
        scenarios experienced in the history of the market.
      </p>
      <h2>How it Works</h2>
      <blockquote className="mx-4 py-2 px-4 border-l-4 border-green-500 mb-6">
        <p className="mb-4">
          Past performance is no guarantee of future results.
        </p>
        <i>—Everyone Ever</i>
      </blockquote>
      <p>
        If we're using historical data to determine our success rates, and we
        know past performance is no guarentee of future results, how does this
        even work?
      </p>
      <p>
        When it comes to any sort of stock market simulation, especially in the
        long term, we can't expect any sort of guarantees. The name of the game
        is risk management, which is where the historical data comes in.
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
          What about if I had experience the{' '}
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
      <h2>Portfolio Risk Management</h2>
      <p>
        Regardless of how many retirment cycles we simulate, we can never
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
        avoids portfolio failure during a 30 year period. This produced the "4%
        rule", which became a useful rule of thumb for retirement simulation. So
        if you had a $1M portfolio, you could safely withdrawal 4%, $40,000,
        annually with minimal risk of portfolio failure.
      </p>
      <p>
        However, things get a bit dicier for early retirees. The longer you
        expand the time horizon of the simulation, the less certain you can be
        of the results, which you can see by the gradual divergence of the
        portfolio ending balances in this simulator.
      </p>
      <p>Luckily, we have plenty of other options to manage risk:</p>
      <ul>
        <li>Start with a higher portfolio</li>
        <li>Reduce your withdrawal percentage</li>
        <li>
          Adjust your annual withdrawals based on market performance rather than
          continuously withdrawing the same (inflation-adjust) amount
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
      <h2>What about Inflation?</h2>
      <p>
        Over a long time horizon, inflation is an extremely important
        consideration in simulations and is easy to underestimate.
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
      <h2>Historical Data Used</h2>
      <h2>How to Use</h2>
      <h3>Detailed stuff about withdrawal strats</h3>
    </div>
  );
}
