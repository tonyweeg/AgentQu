import React, { memo, useState } from 'react';
import { ScoreData, AnalysisModule } from '../lib/types';

interface AnalysisReasonsProps {
  scoreData: ScoreData;
  modules?: AnalysisModule[];
  compact?: boolean;
}

/**
 * Educational explanations for common metrics and signals
 * Helps rookie investors understand what each finding means
 */
const metricExplanations: Record<string, { meaning: string; whyMatters: string; goodBad: 'good' | 'bad' | 'neutral' }> = {
  // P/E Ratio
  'high p/e': {
    meaning: 'P/E (Price-to-Earnings) compares stock price to company profits. High P/E means you pay more for each $1 of earnings.',
    whyMatters: 'Could mean the stock is expensive OR investors expect big future growth. Tech stocks often have high P/E.',
    goodBad: 'neutral',
  },
  'low p/e': {
    meaning: 'Low P/E means the stock is cheap relative to its earnings.',
    whyMatters: 'Could be a bargain, or the market sees problems ahead. Value investors love low P/E stocks.',
    goodBad: 'good',
  },
  'reasonable p/e': {
    meaning: 'P/E is in a normal range compared to the market and industry.',
    whyMatters: 'Stock is fairly priced based on current earnings - not a screaming buy or sell.',
    goodBad: 'good',
  },

  // P/B Ratio
  'high p/b': {
    meaning: 'P/B (Price-to-Book) compares stock price to company assets. High P/B = paying premium over what the company owns.',
    whyMatters: 'High P/B often means strong brand value or intellectual property not on the books.',
    goodBad: 'neutral',
  },
  'low p/b': {
    meaning: 'Stock trades below the value of company assets. Could be undervalued.',
    whyMatters: 'Banks and industrial companies often have low P/B. Could signal a value opportunity.',
    goodBad: 'good',
  },

  // EV/EBITDA
  'expensive ev/ebitda': {
    meaning: 'EV/EBITDA measures total company value vs. operating profits. High = expensive.',
    whyMatters: 'Useful for comparing companies with different debt levels. Above 15x is often considered expensive.',
    goodBad: 'bad',
  },
  'cheap ev/ebitda': {
    meaning: 'Company is cheap relative to its operating profits.',
    whyMatters: 'Below 10x often signals value. Private equity firms look for low EV/EBITDA targets.',
    goodBad: 'good',
  },

  // FCF (Free Cash Flow)
  'strong fcf': {
    meaning: 'Free Cash Flow is money left after running the business. Strong FCF = cash machine.',
    whyMatters: 'Companies with strong FCF can pay dividends, buy back stock, or invest in growth without borrowing.',
    goodBad: 'good',
  },
  'decent fcf': {
    meaning: 'Company generates reasonable free cash flow.',
    whyMatters: 'Not outstanding but healthy. The company isn\'t burning through cash.',
    goodBad: 'good',
  },
  'weak fcf': {
    meaning: 'Little free cash left after operations.',
    whyMatters: 'May need to borrow money for growth or dividends. Watch for improving trends.',
    goodBad: 'bad',
  },
  'fcf yield': {
    meaning: 'FCF Yield = Free Cash Flow ÷ Market Cap. Shows cash return on your investment.',
    whyMatters: 'Above 5% is solid. Think of it like an interest rate on your stock investment.',
    goodBad: 'good',
  },

  // Revenue Growth
  'strong revenue growth': {
    meaning: 'Company is growing sales rapidly.',
    whyMatters: 'Growth attracts investors and can lead to higher stock prices. Key for growth stocks.',
    goodBad: 'good',
  },
  'moderate revenue growth': {
    meaning: 'Sales growing at a reasonable pace.',
    whyMatters: 'Steady growth is sustainable. Not explosive but keeps the business healthy.',
    goodBad: 'neutral',
  },
  'declining revenue': {
    meaning: 'Sales are shrinking.',
    whyMatters: 'Red flag unless there\'s a turnaround plan. Hard to make money with falling sales.',
    goodBad: 'bad',
  },

  // Beta
  'high beta': {
    meaning: 'Beta measures volatility vs. the market. High beta = bigger price swings.',
    whyMatters: 'More risk but more potential reward. Good for traders, risky for retirees.',
    goodBad: 'neutral',
  },
  'low beta': {
    meaning: 'Stock moves less than the overall market.',
    whyMatters: 'Defensive choice. Good for sleeping well at night but may lag in bull markets.',
    goodBad: 'neutral',
  },
  'moderate beta': {
    meaning: 'Stock moves roughly with the market.',
    whyMatters: 'Balanced risk profile. Neither too wild nor too boring.',
    goodBad: 'good',
  },

  // Debt
  'excessive debt': {
    meaning: 'Company has borrowed a lot of money relative to equity.',
    whyMatters: 'High debt means interest payments eat profits. Risky if rates rise or economy slows.',
    goodBad: 'bad',
  },
  'high debt': {
    meaning: 'Debt levels are elevated.',
    whyMatters: 'Not critical but worth monitoring. Can limit company flexibility.',
    goodBad: 'bad',
  },
  'low debt': {
    meaning: 'Company has minimal borrowings.',
    whyMatters: 'Financial flexibility to weather storms or make acquisitions. Sleep-well-at-night factor.',
    goodBad: 'good',
  },
  'manageable debt': {
    meaning: 'Debt is at acceptable levels for the industry.',
    whyMatters: 'Some debt is normal and can boost returns. This level is sustainable.',
    goodBad: 'good',
  },

  // Moving Averages
  'below 200 ma': {
    meaning: '200 MA = 200-day Moving Average. Below it often signals a downtrend.',
    whyMatters: 'Many investors won\'t buy stocks below the 200 MA. Wait for it to cross above.',
    goodBad: 'bad',
  },
  'above 200 ma': {
    meaning: 'Stock is above its 200-day average price - bullish signal.',
    whyMatters: 'Confirms uptrend. Institutions often require this for buying.',
    goodBad: 'good',
  },
  'below 50 ma': {
    meaning: 'Below 50-day Moving Average - short-term weakness.',
    whyMatters: 'Could be a dip to buy or start of bigger decline. Watch for support.',
    goodBad: 'neutral',
  },
  'above 50 ma': {
    meaning: 'Above 50-day average - short-term strength.',
    whyMatters: 'Momentum is positive. Good for swing traders.',
    goodBad: 'good',
  },
  'downtrend': {
    meaning: 'Stock price is generally falling over time.',
    whyMatters: '"Don\'t catch a falling knife." Wait for trend reversal signals.',
    goodBad: 'bad',
  },
  'uptrend': {
    meaning: 'Stock price is generally rising over time.',
    whyMatters: '"The trend is your friend." Easier to make money in uptrends.',
    goodBad: 'good',
  },

  // RSI
  'overbought': {
    meaning: 'RSI above 70. Stock may have risen too fast, too soon.',
    whyMatters: 'Could see a pullback. Not a sell signal alone, but be cautious adding.',
    goodBad: 'neutral',
  },
  'oversold': {
    meaning: 'RSI below 30. Stock may have fallen too far, too fast.',
    whyMatters: 'Could bounce back. Potential buying opportunity if fundamentals are solid.',
    goodBad: 'neutral',
  },

  // Dividends
  'high dividend yield': {
    meaning: 'Stock pays a high percentage in dividends relative to price.',
    whyMatters: 'Great for income investors. But check if it\'s sustainable - very high yields can be traps.',
    goodBad: 'good',
  },
  'growing dividend': {
    meaning: 'Company has been increasing dividend payments.',
    whyMatters: 'Sign of confidence and financial health. Dividend growth investors love this.',
    goodBad: 'good',
  },
  'no dividend': {
    meaning: 'Company doesn\'t pay dividends.',
    whyMatters: 'Reinvesting in growth instead. Fine for growth stocks, but no income.',
    goodBad: 'neutral',
  },

  // Earnings
  'earnings beat': {
    meaning: 'Company exceeded analyst profit expectations.',
    whyMatters: 'Positive surprise often lifts stock price. Shows management under-promises and over-delivers.',
    goodBad: 'good',
  },
  'earnings miss': {
    meaning: 'Profits came in below expectations.',
    whyMatters: 'Disappointing. Stock often drops. Look at the "why" - one-time or recurring?',
    goodBad: 'bad',
  },
  'consistent earnings': {
    meaning: 'Profits are predictable quarter after quarter.',
    whyMatters: 'Wall Street pays premium for predictability. Lower risk investment.',
    goodBad: 'good',
  },

  // Margin
  'high margin': {
    meaning: 'Company keeps a lot of each dollar of sales as profit.',
    whyMatters: 'Pricing power and efficiency. Buffett loves high-margin businesses.',
    goodBad: 'good',
  },
  'low margin': {
    meaning: 'Thin profit margins on sales.',
    whyMatters: 'Competitive industry or cost problems. Small sales decline could wipe out profits.',
    goodBad: 'bad',
  },
  'improving margin': {
    meaning: 'Profit margins are getting better.',
    whyMatters: 'Sign of improving efficiency or pricing power. Very bullish signal.',
    goodBad: 'good',
  },

  // ROE
  'high roe': {
    meaning: 'ROE (Return on Equity) = how much profit from shareholder money. High = efficient.',
    whyMatters: 'Above 15% is solid. Shows company is good at turning your investment into profits.',
    goodBad: 'good',
  },
  'low roe': {
    meaning: 'Poor return on shareholder equity.',
    whyMatters: 'Your money could work harder elsewhere. Look for improving trend.',
    goodBad: 'bad',
  },
};

/**
 * Find matching explanation for a reason text
 */
const getExplanation = (reason: string) => {
  const lowerReason = reason.toLowerCase();

  for (const [key, explanation] of Object.entries(metricExplanations)) {
    if (lowerReason.includes(key)) {
      return explanation;
    }
  }
  return null;
};

/**
 * AnalysisReasons Component
 * Shows why a stock is scored the way it is with educational explanations
 */
const AnalysisReasons: React.FC<AnalysisReasonsProps> = memo(({
  scoreData,
  modules,
  compact = false,
}) => {
  const { breakdown, signals, topReasons, recommendation, confidence } = scoreData;
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    setExpandedReasons(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Get signal icon and color
  const getSignalDisplay = (signal: string) => {
    const displays: Record<string, { icon: string; color: string; bg: string }> = {
      very_bullish: { icon: '▲▲', color: 'text-green-700', bg: 'bg-green-100' },
      bullish: { icon: '▲', color: 'text-green-600', bg: 'bg-green-50' },
      neutral: { icon: '━', color: 'text-yellow-600', bg: 'bg-yellow-50' },
      bearish: { icon: '▼', color: 'text-red-600', bg: 'bg-red-50' },
      very_bearish: { icon: '▼▼', color: 'text-red-700', bg: 'bg-red-100' },
    };
    return displays[signal] || displays.neutral;
  };

  // Strategy info mapping with descriptions
  const strategyInfo: Record<string, { name: string; icon: string; firm: string; description: string }> = {
    valuation: {
      name: 'Valuation',
      icon: '📊',
      firm: 'Goldman Sachs',
      description: 'Is the stock cheap or expensive? Compares price to earnings, book value, and sales.',
    },
    intrinsicvalue: {
      name: 'Intrinsic Value',
      icon: '💎',
      firm: 'Morgan Stanley',
      description: 'What\'s the stock really worth? Estimates true value based on future cash flows.',
    },
    riskassessment: {
      name: 'Risk Assessment',
      icon: '🛡️',
      firm: 'Bridgewater',
      description: 'How risky is this investment? Looks at volatility, debt, and financial stability.',
    },
    earningsquality: {
      name: 'Earnings Quality',
      icon: '📈',
      firm: 'JPMorgan',
      description: 'Are the profits real and repeatable? Checks for accounting tricks and consistency.',
    },
    portfoliofit: {
      name: 'Portfolio Fit',
      icon: '🎯',
      firm: 'BlackRock',
      description: 'Does this fit YOUR portfolio? Considers your risk tolerance and diversification.',
    },
    technicaltiming: {
      name: 'Technical Timing',
      icon: '⚡',
      firm: 'Citadel',
      description: 'Is NOW a good time to buy? Uses price patterns and momentum indicators.',
    },
    dividendquality: {
      name: 'Dividend Quality',
      icon: '💰',
      firm: 'Harvard Model',
      description: 'How good is the dividend? Checks yield, growth history, and sustainability.',
    },
    competitiveposition: {
      name: 'Competitive Moat',
      icon: '🏰',
      firm: 'Bain',
      description: 'Can competitors steal their business? Looks for durable advantages.',
    },
    statisticaledge: {
      name: 'Statistical Edge',
      icon: '🔮',
      firm: 'Renaissance',
      description: 'What do the numbers say? Quant signals from price patterns and data.',
    },
    macroalignment: {
      name: 'Macro Alignment',
      icon: '🌍',
      firm: 'McKinsey',
      description: 'Does the economy help or hurt? Considers interest rates, GDP, inflation.',
    },
    sectoraffinity: {
      name: 'Sector Match',
      icon: '🎪',
      firm: 'Your Preferences',
      description: 'Does this match sectors you like? Based on your investment preferences.',
    },
  };

  // Sort strategies by score (descending)
  const sortedStrategies = Object.entries(breakdown)
    .filter(([key]) => key !== 'base')
    .sort(([, a], [, b]) => (b as number) - (a as number));

  if (compact) {
    return (
      <div className="space-y-1">
        {topReasons?.slice(0, 2).map((reason, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-xs">
              {strategyInfo[reason.strategy.toLowerCase()]?.icon || '•'}
            </span>
            <span className="text-xs text-gray-600 line-clamp-1">
              {reason.reasons[0]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recommendation Summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              recommendation.action === 'STRONG_BUY'
                ? 'bg-green-600 text-white'
                : recommendation.action === 'BUY'
                ? 'bg-green-500 text-white'
                : recommendation.action === 'HOLD'
                ? 'bg-yellow-500 text-white'
                : recommendation.action === 'SELL'
                ? 'bg-orange-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {recommendation.label}
          </span>
          <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{scoreData.total}</div>
          <div className="text-xs text-gray-500">/{scoreData.maxPossible}</div>
          <div className={`text-xs ${confidence.level === 'high' ? 'text-green-600' : confidence.level === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
            {confidence.label}
          </div>
        </div>
      </div>

      {/* Key Factors with Educational Content */}
      {topReasons && topReasons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Factors (tap to learn more)</h4>
          <div className="space-y-2">
            {topReasons.slice(0, 4).map((reason, idx) => {
              const info = strategyInfo[reason.strategy.toLowerCase()];
              const signal = signals[reason.strategy.toLowerCase() as keyof typeof signals];
              const display = getSignalDisplay(signal || 'neutral');
              const reasonKey = `${reason.strategy}-${idx}`;
              const isExpanded = expandedReasons.has(reasonKey);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${display.bg} border border-opacity-50 cursor-pointer transition-all`}
                  onClick={() => toggleExpanded(reasonKey)}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{info?.icon || '•'}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{info?.name || reason.strategy}</span>
                      <span className="text-xs text-gray-500 ml-1">({info?.firm})</span>
                    </div>
                    <span className={`text-xs font-bold ${display.color}`}>
                      {display.icon}
                    </span>
                    <span className="text-xs text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {/* Strategy Description */}
                  {info?.description && (
                    <p className="text-xs text-gray-600 mb-2 italic">
                      {info.description}
                    </p>
                  )}

                  {/* Reasons with Explanations */}
                  <div className="space-y-2">
                    {reason.reasons.slice(0, isExpanded ? 4 : 2).map((r, ridx) => {
                      const explanation = getExplanation(r);

                      return (
                        <div key={ridx} className="text-xs">
                          <div className="flex items-start gap-1">
                            <span className={`font-medium ${
                              explanation?.goodBad === 'good' ? 'text-green-700' :
                              explanation?.goodBad === 'bad' ? 'text-red-700' :
                              'text-gray-700'
                            }`}>
                              {explanation?.goodBad === 'good' ? '✓' :
                               explanation?.goodBad === 'bad' ? '✗' : '•'} {r}
                            </span>
                          </div>

                          {/* Educational explanation on expand */}
                          {isExpanded && explanation && (
                            <div className="mt-1 ml-4 p-2 bg-white bg-opacity-60 rounded text-xs">
                              <p className="text-gray-700">
                                <span className="font-medium">What it means:</span> {explanation.meaning}
                              </p>
                              <p className="text-gray-600 mt-1">
                                <span className="font-medium">Why it matters:</span> {explanation.whyMatters}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!isExpanded && reason.reasons.length > 2 && (
                    <p className="text-xs text-gray-400 mt-1">
                      +{reason.reasons.length - 2} more... (tap to expand)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategy Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Analysis Breakdown</h4>
        <div className="grid grid-cols-2 gap-2">
          {sortedStrategies.slice(0, 6).map(([strategy, score]) => {
            const info = strategyInfo[strategy];
            const signal = signals[strategy as keyof typeof signals];
            const display = getSignalDisplay(signal || 'neutral');
            const maxScore = strategy === 'valuation' || strategy === 'intrinsicvalue' ? 25 :
                            strategy === 'riskassessment' || strategy === 'earningsquality' || strategy === 'technicaltiming' ? 20 :
                            strategy === 'sectoraffinity' ? 20 : 15;
            const percent = ((score as number) / maxScore) * 100;

            return (
              <div key={strategy} className="p-2 bg-white border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">
                    {info?.icon} {info?.name || strategy}
                  </span>
                  <span className={`text-xs font-bold ${display.color}`}>
                    {(score as number)}/{maxScore}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      percent >= 70 ? 'bg-green-500' :
                      percent >= 50 ? 'bg-yellow-500' :
                      percent >= 30 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

AnalysisReasons.displayName = 'AnalysisReasons';

export default AnalysisReasons;
