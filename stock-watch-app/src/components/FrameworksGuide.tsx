import React, { useState, memo } from 'react';

interface Framework {
  id: string;
  name: string;
  firm: string;
  maxPoints: number;
  icon: string;
  philosophy: string;
  evaluates: string[];
  whyWeUseIt: string;
  realWorldExample: string;
}

const frameworks: Framework[] = [
  {
    id: 'valuation',
    name: 'Valuation',
    firm: 'Goldman Sachs',
    maxPoints: 25,
    icon: '📊',
    philosophy: 'Buy quality companies at reasonable prices.',
    evaluates: ['P/E Ratio', 'P/B Ratio', 'PEG Ratio', 'EV/EBITDA'],
    whyWeUseIt: 'The foundation of value investing. These ratios tell you if you\'re paying too much for a dollar of earnings, assets, or growth. Goldman\'s equity research team uses these screens to filter thousands of stocks down to actionable ideas.',
    realWorldExample: 'A stock with P/E of 15 and PEG under 1 suggests you\'re getting growth at a reasonable price—the sweet spot for long-term investors.',
  },
  {
    id: 'intrinsicvalue',
    name: 'Intrinsic Value',
    firm: 'Morgan Stanley',
    maxPoints: 25,
    icon: '💎',
    philosophy: 'Calculate what a stock is truly worth.',
    evaluates: ['Free Cash Flow Yield', 'Price vs Target', 'Earnings Growth', 'Revenue Growth'],
    whyWeUseIt: 'DCF (Discounted Cash Flow) analysis estimates a company\'s true value based on future cash flows. Morgan Stanley\'s research is famous for detailed DCF models. We simplify this by comparing price to analyst targets and FCF yield.',
    realWorldExample: 'If FCF yield is 8% and analyst targets suggest 25% upside, the market may be undervaluing the company\'s cash generation ability.',
  },
  {
    id: 'riskassessment',
    name: 'Risk Assessment',
    firm: 'Bridgewater',
    maxPoints: 20,
    icon: '🛡️',
    philosophy: 'Understand and manage risk systematically.',
    evaluates: ['Beta', 'Debt-to-Equity', 'Current Ratio', 'Volatility'],
    whyWeUseIt: 'Ray Dalio\'s Bridgewater built the world\'s largest hedge fund by obsessing over risk. High debt or volatility can wipe out gains quickly. We penalize risky profiles to protect your capital.',
    realWorldExample: 'A company with debt-to-equity over 2 and beta of 1.8 might double your money—or cut it in half. We flag this.',
  },
  {
    id: 'earningsquality',
    name: 'Earnings Quality',
    firm: 'JPMorgan',
    maxPoints: 20,
    icon: '📈',
    philosophy: 'Quality earnings predict future performance.',
    evaluates: ['Earnings Beat Rate', 'Average Surprise', 'Profit Margins', 'ROE'],
    whyWeUseIt: 'JPMorgan\'s research shows companies that consistently beat estimates tend to outperform. We reward stocks with high beat rates and strong surprises—signs of conservative guidance and execution excellence.',
    realWorldExample: 'A company that beats earnings 80% of the time with 10%+ surprises is under-promising and over-delivering—a management team you can trust.',
  },
  {
    id: 'portfoliofit',
    name: 'Portfolio Fit',
    firm: 'BlackRock',
    maxPoints: 15,
    icon: '🎯',
    philosophy: 'Build better portfolios through smart allocation.',
    evaluates: ['Market Cap', 'Sector Diversification', 'Beta Contribution', 'Liquidity'],
    whyWeUseIt: 'BlackRock manages $10 trillion by thinking about how each position fits the whole portfolio. A great stock in an overweight sector adds risk, not value. We consider fit, not just individual merit.',
    realWorldExample: 'If you\'re already heavy in tech, that hot AI stock might add concentration risk even if it scores well on other metrics.',
  },
  {
    id: 'technicaltiming',
    name: 'Technical Timing',
    firm: 'Citadel',
    maxPoints: 20,
    icon: '⚡',
    philosophy: 'Time entries and exits using price patterns.',
    evaluates: ['RSI', 'MACD', 'Moving Averages', 'ADX Trend Strength'],
    whyWeUseIt: 'Citadel\'s quant strategies combine fundamentals with technicals. RSI tells you if a stock is oversold (buying opportunity) or overbought (wait for pullback). MACD crossovers signal momentum shifts.',
    realWorldExample: 'RSI below 30 with a bullish MACD crossover? That\'s a technical setup that has historically preceded rebounds.',
  },
  {
    id: 'dividendquality',
    name: 'Dividend Quality',
    firm: 'Harvard Endowment',
    maxPoints: 15,
    icon: '💰',
    philosophy: 'Sustainable dividends compound wealth.',
    evaluates: ['Dividend Yield', 'Payout Ratio', 'FCF Coverage', 'Dividend Growth'],
    whyWeUseIt: 'Harvard\'s endowment model emphasizes sustainable income. A 6% yield means nothing if the payout ratio is 120%—that dividend will be cut. We verify dividends are backed by real cash flow.',
    realWorldExample: 'A 3% yield with 40% payout ratio and 10% dividend growth beats a 7% yield that might disappear next quarter.',
  },
  {
    id: 'competitiveposition',
    name: 'Competitive Moat',
    firm: 'Bain & Company',
    maxPoints: 15,
    icon: '🏰',
    philosophy: 'Durable competitive advantages create value.',
    evaluates: ['Market Position', 'Gross Margins', 'Operating Efficiency', 'ROE'],
    whyWeUseIt: 'Bain\'s strategy consulting identifies companies with pricing power and defensible positions. High gross margins (60%+) signal a moat—customers pay premium prices because alternatives aren\'t as good.',
    realWorldExample: 'Apple\'s 40%+ gross margins vs. Dell\'s 20% shows why one commands a premium valuation—customers pay more for the ecosystem.',
  },
  {
    id: 'statisticaledge',
    name: 'Statistical Edge',
    firm: 'Renaissance Technologies',
    maxPoints: 15,
    icon: '🔮',
    philosophy: 'Find statistical edges in price behavior.',
    evaluates: ['52-Week Position', 'Short Interest', 'Institutional Ownership', 'Volume Anomalies'],
    whyWeUseIt: 'Jim Simons\' Renaissance is the most successful quant fund ever. They find patterns others miss. Near 52-week lows with high short interest? That\'s mean reversion and short squeeze potential combined.',
    realWorldExample: 'A stock at its 52-week low with 25% short interest and unusual volume might be setting up for a squeeze.',
  },
  {
    id: 'macroalignment',
    name: 'Macro Alignment',
    firm: 'McKinsey & Company',
    maxPoints: 15,
    icon: '🌍',
    philosophy: 'Align investments with economic conditions.',
    evaluates: ['Economic Cycle Phase', 'Interest Rate Sensitivity', 'VIX / Sentiment', 'GDP Alignment'],
    whyWeUseIt: 'McKinsey advises Fortune 500 CEOs on macro trends. Financials thrive when rates rise; REITs suffer. We adjust scores based on where we are in the economic cycle so you\'re not fighting the Fed.',
    realWorldExample: 'In a high-rate environment, bank stocks get a boost while high-growth tech with no profits faces headwinds.',
  },
];

const FrameworksGuide: React.FC<{ onClose?: () => void }> = memo(({ onClose }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalMaxPoints = frameworks.reduce((sum, f) => sum + f.maxPoints, 0) + 20; // +20 for sector affinity

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">
              How We Score Stocks
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              10 Wall Street frameworks, unified
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 text-lg leading-relaxed font-light">
            Every stock receives a score from <span className="font-medium text-gray-900">0 to {totalMaxPoints}</span> points,
            calculated across ten distinct analytical frameworks. Each framework is inspired by how the world's
            leading investment firms evaluate opportunities—from Goldman's value screens to Renaissance's
            statistical patterns.
          </p>
        </div>

        {/* Visual Score Breakdown */}
        <div className="mt-8 mb-12">
          <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden">
            {frameworks.map((f, idx) => (
              <div
                key={f.id}
                className="h-full transition-all duration-300 cursor-pointer relative group"
                style={{
                  width: `${(f.maxPoints / totalMaxPoints) * 100}%`,
                  backgroundColor: `hsl(${210 + idx * 15}, 60%, ${45 + idx * 3}%)`,
                }}
                onMouseEnter={() => setHoveredId(f.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
              >
                {hoveredId === f.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20">
                    {f.name}: {f.maxPoints} pts
                  </div>
                )}
              </div>
            ))}
            {/* Sector Affinity */}
            <div
              className="h-full bg-purple-500 transition-all duration-300 cursor-pointer relative"
              style={{ width: `${(20 / totalMaxPoints) * 100}%` }}
              onMouseEnter={() => setHoveredId('sector')}
              onMouseLeave={() => setHoveredId(null)}
            >
              {hoveredId === 'sector' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20">
                  Your Preferences: 20 pts
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Tap any segment to learn more
          </p>
        </div>

        {/* Framework Cards */}
        <div className="space-y-1">
          {frameworks.map((framework, idx) => (
            <FrameworkCard
              key={framework.id}
              framework={framework}
              index={idx + 1}
              isExpanded={expandedId === framework.id}
              onToggle={() => setExpandedId(expandedId === framework.id ? null : framework.id)}
            />
          ))}

          {/* Sector Affinity - Special Card */}
          <div className="border-t-2 border-purple-200 pt-4 mt-6">
            <div
              className={`group cursor-pointer transition-all duration-300 ${
                expandedId === 'sector' ? 'bg-purple-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setExpandedId(expandedId === 'sector' ? null : 'sector')}
            >
              <div className="flex items-start gap-4 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-purple-600 font-medium">BONUS</span>
                    <h3 className="text-lg font-medium text-gray-900">Your Preferences</h3>
                    <span className="text-sm text-gray-400 ml-auto">20 pts</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Personalized scoring based on your sector interests, risk tolerance, and time horizon.
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === 'sector' ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {expandedId === 'sector' && (
                <div className="px-4 pb-4 pt-2 border-t border-purple-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        What We Evaluate
                      </h4>
                      <ul className="space-y-1">
                        {['Sector Affinity Match', 'Risk Tolerance Alignment', 'Time Horizon Fit'].map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1 h-1 rounded-full bg-purple-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Why It Matters
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        The best investment for you depends on your goals. A retiree seeking income
                        needs different stocks than a 25-year-old building wealth. We weight scores
                        toward what actually fits your situation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Philosophy */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <blockquote className="text-center">
            <p className="text-lg text-gray-600 font-light italic">
              "The goal is not to predict the future, but to be prepared for it."
            </p>
            <cite className="text-sm text-gray-400 mt-2 block">— Inspired by Bridgewater's Principles</cite>
          </blockquote>

          <div className="mt-8 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-light text-gray-900">10</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Frameworks</div>
            </div>
            <div>
              <div className="text-3xl font-light text-gray-900">{totalMaxPoints}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Max Score</div>
            </div>
            <div>
              <div className="text-3xl font-light text-gray-900">∞</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Possibilities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface FrameworkCardProps {
  framework: Framework;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const FrameworkCard: React.FC<FrameworkCardProps> = memo(({ framework, index, isExpanded, onToggle }) => {
  return (
    <div
      className={`group cursor-pointer transition-all duration-300 ${
        isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onToggle}
    >
      {/* Collapsed View */}
      <div className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg group-hover:bg-blue-100 transition-colors">
          {framework.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-400 font-mono">{String(index).padStart(2, '0')}</span>
            <h3 className="text-lg font-medium text-gray-900">{framework.name}</h3>
            <span className="text-xs text-gray-400 hidden sm:inline">— {framework.firm}</span>
            <span className="text-sm text-gray-400 ml-auto">{framework.maxPoints} pts</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 italic">"{framework.philosophy}"</p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  What We Evaluate
                </h4>
                <ul className="space-y-1">
                  {framework.evaluates.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1 h-1 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Inspired By
                </h4>
                <p className="text-sm text-gray-600">
                  {framework.firm}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Why We Use It
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {framework.whyWeUseIt}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                  Example
                </h4>
                <p className="text-sm text-gray-600">
                  {framework.realWorldExample}
                </p>
              </div>
            </div>
          </div>

          {/* Score Weight Visual */}
          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Weight:</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(framework.maxPoints / 25) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {framework.maxPoints}/25 max
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

FrameworkCard.displayName = 'FrameworkCard';
FrameworksGuide.displayName = 'FrameworksGuide';

export default FrameworksGuide;
