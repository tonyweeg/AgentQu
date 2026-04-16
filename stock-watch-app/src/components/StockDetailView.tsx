import React, { useState, memo } from 'react';
import { Stock, ScoreData, AnalysisModule } from '../lib/types';
import CandlestickChart from './CandlestickChart';
import PriceTargetIndicator from './PriceTargetIndicator';
import AnalysisReasons from './AnalysisReasons';
import TechnicalIndicators from './TechnicalIndicators';

// Value assessment function - returns verdict and color based on metric value
const assessMetricValue = (metricKey: string, value: number | undefined): { verdict: string; color: string; emoji: string } => {
  if (value === undefined || isNaN(value)) {
    return { verdict: 'No data available', color: 'text-gray-500', emoji: '❓' };
  }

  switch (metricKey) {
    case 'P/E Ratio':
      if (value < 0) return { verdict: 'Negative earnings - company losing money', color: 'text-red-600', emoji: '🔴' };
      if (value < 15) return { verdict: 'Below average - potentially undervalued', color: 'text-green-600', emoji: '🟢' };
      if (value <= 25) return { verdict: 'Average range - fairly valued', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 40) return { verdict: 'Above average - growth expectations priced in', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high - expensive or high growth expectations', color: 'text-red-500', emoji: '🔴' };

    case 'Forward P/E':
      if (value < 0) return { verdict: 'Negative future earnings expected', color: 'text-red-600', emoji: '🔴' };
      if (value < 12) return { verdict: 'Low - analysts expect strong earnings growth', color: 'text-green-600', emoji: '🟢' };
      if (value <= 20) return { verdict: 'Reasonable forward valuation', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 30) return { verdict: 'Elevated - high growth priced in', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high forward P/E - verify growth assumptions', color: 'text-red-500', emoji: '🔴' };

    case 'P/B Ratio':
      if (value < 1) return { verdict: 'Trading below book value - potential value or distress', color: 'text-green-600', emoji: '🟢' };
      if (value <= 3) return { verdict: 'Reasonable range for most industries', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 5) return { verdict: 'Premium valuation - intangible assets valued', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high - typical for asset-light tech/brands', color: 'text-blue-500', emoji: '🔵' };

    case 'P/S Ratio':
      if (value < 1) return { verdict: 'Low P/S - potential value play', color: 'text-green-600', emoji: '🟢' };
      if (value <= 4) return { verdict: 'Typical range for established companies', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 10) return { verdict: 'Premium - high margins expected', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high - SaaS/high-growth pricing', color: 'text-red-500', emoji: '🔴' };

    case 'EV/EBITDA':
      if (value < 8) return { verdict: 'Attractive valuation vs. operating earnings', color: 'text-green-600', emoji: '🟢' };
      if (value <= 12) return { verdict: 'Fair value range', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 20) return { verdict: 'Premium valuation', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high - growth premium or speculation', color: 'text-red-500', emoji: '🔴' };

    case 'PEG Ratio':
      if (value < 0) return { verdict: 'Negative - declining earnings', color: 'text-red-600', emoji: '🔴' };
      if (value < 1) return { verdict: 'Undervalued relative to growth - attractive', color: 'text-green-600', emoji: '🟢' };
      if (value <= 1.5) return { verdict: 'Fair value relative to growth', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 2) return { verdict: 'Slightly expensive for growth rate', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Expensive even accounting for growth', color: 'text-red-500', emoji: '🔴' };

    case 'EPS':
      if (value < 0) return { verdict: 'Losing money - not yet profitable', color: 'text-red-600', emoji: '🔴' };
      if (value < 1) return { verdict: 'Low EPS - early stage or thin margins', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 5) return { verdict: 'Solid earnings per share', color: 'text-green-500', emoji: '🟢' };
      return { verdict: 'Strong earnings per share', color: 'text-green-600', emoji: '🟢' };

    case 'Net Margin':
      const netMarginPct = value * 100;
      if (netMarginPct < 0) return { verdict: 'Unprofitable - losing money', color: 'text-red-600', emoji: '🔴' };
      if (netMarginPct < 5) return { verdict: 'Low margin - competitive/commodity business', color: 'text-yellow-600', emoji: '🟡' };
      if (netMarginPct <= 15) return { verdict: 'Healthy margins', color: 'text-green-500', emoji: '🟢' };
      if (netMarginPct <= 25) return { verdict: 'Excellent margins - pricing power', color: 'text-green-600', emoji: '🟢' };
      return { verdict: 'Outstanding margins - dominant position', color: 'text-green-700', emoji: '🟢' };

    case 'ROE':
      const roePct = value * 100;
      if (roePct < 0) return { verdict: 'Negative - destroying shareholder value', color: 'text-red-600', emoji: '🔴' };
      if (roePct < 10) return { verdict: 'Below average capital efficiency', color: 'text-yellow-600', emoji: '🟡' };
      if (roePct <= 15) return { verdict: 'Average return on equity', color: 'text-yellow-500', emoji: '🟡' };
      if (roePct <= 25) return { verdict: 'Strong ROE - quality business', color: 'text-green-600', emoji: '🟢' };
      return { verdict: 'Exceptional ROE - verify not from excessive debt', color: 'text-green-700', emoji: '🟢' };

    case 'ROA':
      const roaPct = value * 100;
      if (roaPct < 0) return { verdict: 'Negative - assets not generating returns', color: 'text-red-600', emoji: '🔴' };
      if (roaPct < 5) return { verdict: 'Low - asset-intensive business or struggling', color: 'text-yellow-600', emoji: '🟡' };
      if (roaPct <= 10) return { verdict: 'Solid asset efficiency', color: 'text-green-500', emoji: '🟢' };
      return { verdict: 'Excellent asset utilization', color: 'text-green-600', emoji: '🟢' };

    case 'Revenue Growth':
      const revGrowthPct = value * 100;
      if (revGrowthPct < -10) return { verdict: 'Significant decline - investigate cause', color: 'text-red-600', emoji: '🔴' };
      if (revGrowthPct < 0) return { verdict: 'Declining revenue - concerning', color: 'text-orange-500', emoji: '🟠' };
      if (revGrowthPct < 10) return { verdict: 'Modest growth - mature business', color: 'text-yellow-600', emoji: '🟡' };
      if (revGrowthPct <= 20) return { verdict: 'Healthy growth rate', color: 'text-green-500', emoji: '🟢' };
      return { verdict: 'High growth - verify sustainability', color: 'text-green-600', emoji: '🟢' };

    case 'EPS Growth':
      const epsGrowthPct = value * 100;
      if (epsGrowthPct < -20) return { verdict: 'Severe earnings decline', color: 'text-red-600', emoji: '🔴' };
      if (epsGrowthPct < 0) return { verdict: 'Declining earnings - investigate', color: 'text-orange-500', emoji: '🟠' };
      if (epsGrowthPct < 10) return { verdict: 'Modest earnings growth', color: 'text-yellow-600', emoji: '🟡' };
      if (epsGrowthPct <= 25) return { verdict: 'Strong earnings growth', color: 'text-green-500', emoji: '🟢' };
      return { verdict: 'Exceptional growth - verify quality', color: 'text-green-600', emoji: '🟢' };

    case 'Debt/Equity':
      if (value < 0.3) return { verdict: 'Very conservative - low leverage', color: 'text-green-600', emoji: '🟢' };
      if (value <= 0.7) return { verdict: 'Modest leverage - healthy balance', color: 'text-green-500', emoji: '🟢' };
      if (value <= 1.5) return { verdict: 'Moderate leverage - watch trends', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 2.5) return { verdict: 'High leverage - increased risk', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high debt - elevated risk', color: 'text-red-500', emoji: '🔴' };

    case 'Current Ratio':
      if (value < 1) return { verdict: 'Below 1 - potential liquidity issues', color: 'text-red-600', emoji: '🔴' };
      if (value < 1.5) return { verdict: 'Adequate but tight liquidity', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 2.5) return { verdict: 'Healthy liquidity position', color: 'text-green-600', emoji: '🟢' };
      return { verdict: 'Very strong liquidity - possibly inefficient capital', color: 'text-blue-500', emoji: '🔵' };

    case 'Quick Ratio':
      if (value < 0.5) return { verdict: 'Low - may struggle without inventory sales', color: 'text-red-600', emoji: '🔴' };
      if (value < 1) return { verdict: 'Below 1 - relies on inventory conversion', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 1.5) return { verdict: 'Solid quick ratio', color: 'text-green-500', emoji: '🟢' };
      return { verdict: 'Strong immediate liquidity', color: 'text-green-600', emoji: '🟢' };

    case 'Free Cash Flow':
      if (value < 0) return { verdict: 'Burning cash - investing or struggling', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Generating free cash - positive sign', color: 'text-green-600', emoji: '🟢' };

    case 'Dividend Yield':
      if (value === 0) return { verdict: 'No dividend - growth focus', color: 'text-gray-500', emoji: '⚪' };
      if (value < 2) return { verdict: 'Low yield - growth-oriented payer', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 4) return { verdict: 'Solid yield - balanced approach', color: 'text-green-500', emoji: '🟢' };
      if (value <= 6) return { verdict: 'High yield - verify sustainability', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high yield - potential yield trap', color: 'text-red-500', emoji: '🔴' };

    case 'Payout Ratio':
      const payoutPct = value * 100;
      if (payoutPct < 0) return { verdict: 'Negative - paying from reserves', color: 'text-red-600', emoji: '🔴' };
      if (payoutPct < 40) return { verdict: 'Low payout - room for increases', color: 'text-green-600', emoji: '🟢' };
      if (payoutPct <= 60) return { verdict: 'Sustainable payout level', color: 'text-green-500', emoji: '🟢' };
      if (payoutPct <= 80) return { verdict: 'High payout - limited growth reinvestment', color: 'text-yellow-600', emoji: '🟡' };
      return { verdict: 'Very high - dividend may be at risk', color: 'text-red-500', emoji: '🔴' };

    case 'Beta':
      if (value < 0) return { verdict: 'Negative beta - moves opposite to market (rare)', color: 'text-blue-500', emoji: '🔵' };
      if (value < 0.8) return { verdict: 'Low volatility - defensive stock', color: 'text-green-600', emoji: '🟢' };
      if (value <= 1.2) return { verdict: 'Market-like volatility', color: 'text-yellow-600', emoji: '🟡' };
      if (value <= 1.5) return { verdict: 'Higher than market volatility', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'High beta - aggressive/volatile', color: 'text-red-500', emoji: '🔴' };

    case 'Short % Float':
      const shortPct = value * 100;
      if (shortPct < 3) return { verdict: 'Low short interest - limited bearish bets', color: 'text-green-600', emoji: '🟢' };
      if (shortPct < 10) return { verdict: 'Moderate short interest', color: 'text-yellow-600', emoji: '🟡' };
      if (shortPct < 20) return { verdict: 'High short interest - squeeze potential or concern', color: 'text-orange-500', emoji: '🟠' };
      return { verdict: 'Very high shorts - extreme bearish sentiment', color: 'text-red-500', emoji: '🔴' };

    case 'Inst. Ownership':
      const instPct = value * 100;
      if (instPct < 30) return { verdict: 'Low institutional interest', color: 'text-yellow-600', emoji: '🟡' };
      if (instPct < 60) return { verdict: 'Moderate institutional ownership', color: 'text-green-500', emoji: '🟢' };
      if (instPct <= 85) return { verdict: 'High institutional ownership - smart money present', color: 'text-green-600', emoji: '🟢' };
      return { verdict: 'Very high - watch for institutional selling', color: 'text-blue-500', emoji: '🔵' };

    default:
      return { verdict: 'Value assessment not available', color: 'text-gray-500', emoji: '❓' };
  }
};

// Comprehensive metric explanations for investor education
const METRIC_EXPLANATIONS: Record<string, { title: string; description: string; interpretation: string; usage: string }> = {
  'P/E Ratio': {
    title: 'Price-to-Earnings Ratio (P/E)',
    description: 'The P/E ratio measures how much investors are willing to pay for each dollar of a company\'s earnings. It\'s calculated by dividing the current stock price by the earnings per share (EPS).',
    interpretation: '• Low P/E (under 15): May indicate undervaluation or low growth expectations\n• Average P/E (15-25): Typical for stable, mature companies\n• High P/E (over 25): Suggests high growth expectations or potential overvaluation\n• Negative P/E: Company is losing money',
    usage: 'Compare P/E ratios within the same industry. A tech stock with P/E of 30 might be cheap while a utility at 30 could be expensive. Always consider growth rate alongside P/E.',
  },
  'Forward P/E': {
    title: 'Forward Price-to-Earnings Ratio',
    description: 'Forward P/E uses estimated future earnings (typically next 12 months) instead of trailing earnings. It reflects what investors expect the company to earn, not what it has already earned.',
    interpretation: '• Forward P/E < Trailing P/E: Analysts expect earnings growth\n• Forward P/E > Trailing P/E: Analysts expect earnings decline\n• Much lower Forward P/E: Strong growth anticipated',
    usage: 'Compare Forward P/E to trailing P/E to gauge earnings expectations. A stock with trailing P/E of 40 but forward P/E of 20 is expected to double earnings—verify if that\'s realistic.',
  },
  'P/B Ratio': {
    title: 'Price-to-Book Ratio (P/B)',
    description: 'P/B compares a stock\'s market value to its book value (assets minus liabilities). It shows how much investors pay for each dollar of net assets.',
    interpretation: '• P/B < 1: Stock trades below book value—potential bargain or troubled company\n• P/B 1-3: Reasonable for most industries\n• P/B > 3: Premium valuation, common in tech/growth stocks\n• Very high P/B: Asset-light businesses (software, brands)',
    usage: 'Most useful for banks, insurers, and asset-heavy industries. Less meaningful for tech companies where intellectual property and brand value aren\'t reflected in book value.',
  },
  'P/S Ratio': {
    title: 'Price-to-Sales Ratio (P/S)',
    description: 'P/S compares stock price to revenue per share. Unlike P/E, it works even for unprofitable companies since it focuses on sales, not earnings.',
    interpretation: '• P/S < 1: Potential value opportunity\n• P/S 1-4: Typical range for most industries\n• P/S > 10: High growth expectations (common in SaaS)\n• Compare to industry average and margins',
    usage: 'Essential for evaluating growth companies that aren\'t yet profitable. Consider alongside profit margins—a low P/S with expanding margins is bullish.',
  },
  'EV/EBITDA': {
    title: 'Enterprise Value to EBITDA',
    description: 'EV/EBITDA compares total company value (market cap + debt - cash) to operating earnings before interest, taxes, depreciation, and amortization. It\'s capital structure neutral.',
    interpretation: '• EV/EBITDA < 8: Often considered cheap\n• EV/EBITDA 8-12: Fair value for many industries\n• EV/EBITDA > 15: Growth premium or overvaluation\n• Useful for comparing companies with different debt levels',
    usage: 'Favored by private equity and M&A analysts. Especially useful when comparing potential acquisition targets or companies with varying capital structures.',
  },
  'PEG Ratio': {
    title: 'Price/Earnings-to-Growth Ratio',
    description: 'PEG divides P/E ratio by expected earnings growth rate. It adjusts valuation for growth, helping compare stocks with different growth profiles.',
    interpretation: '• PEG < 1: Stock may be undervalued relative to growth\n• PEG = 1: Fair value according to Peter Lynch\n• PEG > 2: May be overvalued even accounting for growth\n• Negative PEG: Declining earnings (not meaningful)',
    usage: 'Popularized by Peter Lynch. Best used for growth stocks. A high P/E stock with PEG under 1 may actually be cheaper than a low P/E stock with PEG over 2.',
  },
  'EPS': {
    title: 'Earnings Per Share',
    description: 'EPS is net income divided by shares outstanding. It shows how much profit the company generates for each share you own.',
    interpretation: '• Positive and growing EPS: Healthy profitability\n• Declining EPS: Investigate why—competition, investments, or problems\n• Negative EPS: Company losing money\n• Compare year-over-year and quarter-over-quarter',
    usage: 'The foundation for P/E ratio. Track EPS growth trends over 3-5 years. Beware of EPS manipulation through buybacks—look at total net income too.',
  },
  'Net Margin': {
    title: 'Net Profit Margin',
    description: 'Net margin is net income divided by revenue—the percentage of each sales dollar that becomes profit after all expenses, taxes, and interest.',
    interpretation: '• 20%+: Excellent (software, pharma)\n• 10-20%: Good for most industries\n• 5-10%: Typical for retail, manufacturing\n• Under 5%: Low-margin business or struggling\n• Negative: Losing money on operations',
    usage: 'Compare to industry peers and track trends. Expanding margins signal operational leverage. Contracting margins may indicate pricing pressure or rising costs.',
  },
  'ROE': {
    title: 'Return on Equity',
    description: 'ROE measures how effectively a company uses shareholder equity to generate profits. It\'s net income divided by shareholder equity.',
    interpretation: '• ROE > 20%: Excellent capital efficiency\n• ROE 15-20%: Above average\n• ROE 10-15%: Average\n• ROE < 10%: Below average\n• Very high ROE: Check if driven by excessive debt',
    usage: 'Warren Buffett\'s favorite metric. Consistent ROE above 15% over 5+ years indicates a quality business. Beware of artificially high ROE from buybacks or leverage.',
  },
  'ROA': {
    title: 'Return on Assets',
    description: 'ROA shows how efficiently a company uses all its assets (not just equity) to generate profit. It\'s net income divided by total assets.',
    interpretation: '• ROA > 10%: Very efficient asset utilization\n• ROA 5-10%: Good for asset-heavy industries\n• ROA < 5%: Asset-intensive or struggling\n• Compare within same industry only',
    usage: 'Best for comparing companies in asset-heavy industries like manufacturing, utilities, or banking. Less meaningful for asset-light tech companies.',
  },
  'Revenue Growth': {
    title: 'Revenue Growth Rate',
    description: 'Year-over-year percentage increase in total sales. The top-line growth that drives long-term value creation.',
    interpretation: '• 20%+: High growth (typical for successful tech)\n• 10-20%: Solid growth\n• 0-10%: Mature company growth\n• Negative: Declining sales—investigate cause\n• Compare to industry growth rate',
    usage: 'Revenue growth is hard to fake. Sustainable growth above 15% combined with stable or expanding margins is the holy grail. Watch for one-time boosts vs. organic growth.',
  },
  'EPS Growth': {
    title: 'Earnings Per Share Growth',
    description: 'Year-over-year percentage increase in EPS. Shows how quickly profits are growing on a per-share basis.',
    interpretation: '• 25%+: High growth company\n• 10-25%: Healthy growth\n• 0-10%: Stable but slow\n• Negative: Earnings declining\n• Compare to revenue growth for quality',
    usage: 'EPS growth faster than revenue growth indicates margin expansion or buybacks. Slower EPS than revenue growth suggests margin compression. Look for consistent growth over 3-5 years.',
  },
  'Debt/Equity': {
    title: 'Debt-to-Equity Ratio',
    description: 'D/E compares total debt to shareholder equity. It measures financial leverage—how much debt is used to finance the company relative to equity.',
    interpretation: '• D/E < 0.5: Conservative, low leverage\n• D/E 0.5-1: Moderate leverage\n• D/E 1-2: Higher leverage, common in capital-intensive industries\n• D/E > 2: High debt load, potential risk\n• Industry context matters significantly',
    usage: 'Compare to industry averages. Utilities and REITs normally have higher D/E. Tech companies should have lower D/E. Rising D/E over time is a warning sign.',
  },
  'Current Ratio': {
    title: 'Current Ratio',
    description: 'Current assets divided by current liabilities. Measures ability to pay short-term obligations (due within one year) with short-term assets.',
    interpretation: '• Current Ratio > 2: Strong liquidity\n• Current Ratio 1-2: Adequate liquidity\n• Current Ratio < 1: Liquidity concerns—may struggle to pay bills\n• Very high (>3): May be inefficient with capital',
    usage: 'Essential for assessing bankruptcy risk. A sudden drop in current ratio can signal trouble ahead. Compare trends over time and to industry peers.',
  },
  'Quick Ratio': {
    title: 'Quick Ratio (Acid Test)',
    description: 'Like current ratio but excludes inventory. Shows ability to pay short-term obligations with most liquid assets (cash, receivables, short-term investments).',
    interpretation: '• Quick Ratio > 1: Can cover immediate obligations\n• Quick Ratio 0.5-1: May need to sell inventory\n• Quick Ratio < 0.5: Potential liquidity crisis\n• More conservative than current ratio',
    usage: 'Better than current ratio for companies with slow-moving inventory. Critical for retail and manufacturing analysis. A quick ratio under 1 with declining trend is a red flag.',
  },
  'Free Cash Flow': {
    title: 'Free Cash Flow (FCF)',
    description: 'Cash generated from operations minus capital expenditures. The actual cash available for dividends, debt repayment, buybacks, or reinvestment.',
    interpretation: '• Positive and growing: Healthy cash generation\n• Higher than net income: Quality earnings\n• Lower than net income: Possible accounting vs. cash disconnect\n• Negative: Burning cash (okay if investing for growth)',
    usage: 'Many consider FCF the truest measure of profitability. Companies can manipulate earnings but cash is cash. Look for FCF yield (FCF/market cap) above 5% for value.',
  },
  'Dividend Yield': {
    title: 'Dividend Yield',
    description: 'Annual dividend per share divided by stock price. Shows the income return you receive from dividends alone, excluding capital gains.',
    interpretation: '• 0%: No dividend (growth stocks)\n• 1-2%: Typical for growth-oriented dividend payers\n• 2-4%: Healthy yield for established companies\n• 4-6%: High yield—verify it\'s sustainable\n• 6%+: Yield trap warning—check payout ratio',
    usage: 'Don\'t chase yield alone. Very high yields often precede dividend cuts. Look for dividend growth history (Dividend Aristocrats) over current yield.',
  },
  'Payout Ratio': {
    title: 'Dividend Payout Ratio',
    description: 'Percentage of earnings paid out as dividends. Shows how much profit goes to shareholders vs. reinvestment in the business.',
    interpretation: '• Under 30%: Very sustainable, room for increases\n• 30-50%: Healthy and sustainable\n• 50-70%: High but often manageable\n• Over 70%: May be unsustainable\n• Over 100%: Paying from reserves—dividend at risk',
    usage: 'Critical for dividend investors. Payout ratio over 80% is a warning sign unless the company is a REIT or MLP (which must distribute most income). Track trend over time.',
  },
  'Beta': {
    title: 'Beta (Volatility)',
    description: 'Measures a stock\'s volatility compared to the overall market (S&P 500 = 1.0). Shows how much the stock moves relative to market swings.',
    interpretation: '• Beta < 0.8: Less volatile than market (defensive)\n• Beta 0.8-1.2: Moves with market\n• Beta > 1.2: More volatile than market (aggressive)\n• Beta < 0: Moves opposite to market (rare)\n• High beta = higher risk and potential return',
    usage: 'Use beta for portfolio construction. Lower beta stocks for stability, higher beta for growth. In bear markets, low beta outperforms. In bull markets, high beta wins.',
  },
  'Short % Float': {
    title: 'Short Interest (% of Float)',
    description: 'Percentage of tradeable shares (float) currently sold short. Short sellers borrow and sell shares betting the price will fall.',
    interpretation: '• Under 5%: Normal short interest\n• 5-10%: Moderate skepticism\n• 10-20%: High short interest\n• Over 20%: Heavily shorted—potential squeeze or real problems\n• Days to cover also important',
    usage: 'High short interest can mean: 1) Smart money sees problems, or 2) Short squeeze potential. Research why shorts are betting against it before deciding.',
  },
  'Inst. Ownership': {
    title: 'Institutional Ownership',
    description: 'Percentage of shares held by institutional investors (mutual funds, pension funds, hedge funds). Shows professional investor interest.',
    interpretation: '• 70%+: Very high institutional ownership\n• 40-70%: Moderate institutional presence\n• Under 40%: Lower institutional interest\n• Rising ownership: Institutions accumulating\n• Falling ownership: Institutions selling',
    usage: 'High institutional ownership provides liquidity but can cause volatility when they sell. Very low ownership might mean undiscovered opportunity or lack of quality. Track changes quarter-over-quarter.',
  },
};

// Simplified analysis data interface - just what this component needs
interface AnalysisData {
  stock: Stock;
  analysis: {
    score: ScoreData;
    explanation?: {
      summary: string;
      recommendation: string;
      recommendationDescription: string;
    };
    modules: AnalysisModule[];
  };
}

interface StockDetailViewProps {
  stock: Stock | null;
  analysis: AnalysisData | null;
  loading: boolean;
  onClose: () => void;
  onAddToWatchlist: (symbol: string) => void;
  isInWatchlist: boolean;
}

/**
 * StockDetailView Component
 * Comprehensive stock analysis view with charts and insights
 */
const StockDetailView: React.FC<StockDetailViewProps> = memo(({
  stock,
  analysis,
  loading,
  onClose,
  onAddToWatchlist,
  isInWatchlist,
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chart' | 'fundamentals'>('analysis');
  const [chartRange, setChartRange] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [activeMetricModal, setActiveMetricModal] = useState<{ key: string; rawValue?: number; displayValue?: string } | null>(null);

  // Handler for opening metric info modal
  const handleMetricClick = (label: string, rawValue?: number, displayValue?: string) => {
    setActiveMetricModal({ key: label, rawValue, displayValue });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
          <div className="animate-pulse text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">Analyzing {stock?.symbol || 'stock'}...</p>
            <p className="text-sm text-gray-400 mt-2">Running 10 Wall Street analysis frameworks</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stock || !analysis) {
    return null;
  }

  const { quote, profile, metrics, priceTarget, recommendations } = analysis.stock;
  const { score, modules } = analysis.analysis;
  // Historical data may be passed through as extra property
  const historical = (analysis.stock as any)?.historical;

  // Price change display
  const priceChange = quote?.regularMarketChange || 0;
  const priceChangePercent = quote?.regularMarketChangePercent || 0;
  const isPositive = priceChange >= 0;

  // Chart data from historical
  const chartData = (historical as any)?.prices || [];

  // Filter chart data by range and add today's candle from quote
  const getFilteredChartData = () => {
    const now = new Date();
    const ranges: Record<string, number> = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    };

    const daysBack = ranges[chartRange] || 90;
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Filter historical data
    const filteredData = chartData.length
      ? chartData.filter((d: any) => new Date(d.date) >= cutoff)
      : [];

    // Add today's candle from quote data if we have it
    if (quote?.regularMarketPrice && quote?.regularMarketOpen) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // Check if we already have today's candle in historical data
      const lastCandle = filteredData[filteredData.length - 1];
      const lastCandleDate = lastCandle ? new Date(lastCandle.date) : null;
      lastCandleDate?.setHours(0, 0, 0, 0);

      const alreadyHasToday = lastCandleDate && lastCandleDate.getTime() === today.getTime();

      if (!alreadyHasToday) {
        // Create today's candle from quote data
        const todayCandle = {
          date: todayStr,
          open: quote.regularMarketOpen,
          high: quote.regularMarketDayHigh || Math.max(quote.regularMarketOpen, quote.regularMarketPrice),
          low: quote.regularMarketDayLow || Math.min(quote.regularMarketOpen, quote.regularMarketPrice),
          close: quote.regularMarketPrice,
          volume: quote.regularMarketVolume || 0,
        };
        filteredData.push(todayCandle);
      }
    }

    return filteredData;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 my-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10 rounded-t-lg">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{stock.symbol}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-sm font-bold ${
                      score.recommendation.action === 'STRONG_BUY'
                        ? 'bg-green-600 text-white'
                        : score.recommendation.action === 'BUY'
                        ? 'bg-green-500 text-white'
                        : score.recommendation.action === 'HOLD'
                        ? 'bg-yellow-500 text-white'
                        : score.recommendation.action === 'SELL'
                        ? 'bg-orange-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {score.recommendation.label}
                  </span>
                </div>
                <p className="text-gray-500">{profile?.name || quote?.shortName}</p>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* Price Display */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                ${quote?.regularMarketPrice?.toFixed(2) || '—'}
              </span>
              <span
                className={`text-lg font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}
                {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4 border-b -mb-4 pb-0">
              {(['analysis', 'chart', 'fundamentals'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'analysis' ? '📊 Analysis' : tab === 'chart' ? '📈 Chart' : '📋 Fundamentals'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Price Target */}
              {priceTarget && priceTarget.targetMean > 0 && (
                <PriceTargetIndicator
                  currentPrice={quote?.regularMarketPrice || 0}
                  targetLow={priceTarget.targetLow}
                  targetMean={priceTarget.targetMean}
                  targetHigh={priceTarget.targetHigh}
                />
              )}

              {/* Analyst Recommendations */}
              {recommendations && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Analyst Ratings</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 rounded-full overflow-hidden flex">
                      <div
                        className="bg-green-600 h-full"
                        style={{ width: `${(recommendations.strongBuy / (recommendations.strongBuy + recommendations.buy + recommendations.hold + recommendations.sell + recommendations.strongSell)) * 100}%` }}
                        title={`Strong Buy: ${recommendations.strongBuy}`}
                      />
                      <div
                        className="bg-green-400 h-full"
                        style={{ width: `${(recommendations.buy / (recommendations.strongBuy + recommendations.buy + recommendations.hold + recommendations.sell + recommendations.strongSell)) * 100}%` }}
                        title={`Buy: ${recommendations.buy}`}
                      />
                      <div
                        className="bg-yellow-400 h-full"
                        style={{ width: `${(recommendations.hold / (recommendations.strongBuy + recommendations.buy + recommendations.hold + recommendations.sell + recommendations.strongSell)) * 100}%` }}
                        title={`Hold: ${recommendations.hold}`}
                      />
                      <div
                        className="bg-orange-400 h-full"
                        style={{ width: `${(recommendations.sell / (recommendations.strongBuy + recommendations.buy + recommendations.hold + recommendations.sell + recommendations.strongSell)) * 100}%` }}
                        title={`Sell: ${recommendations.sell}`}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${(recommendations.strongSell / (recommendations.strongBuy + recommendations.buy + recommendations.hold + recommendations.sell + recommendations.strongSell)) * 100}%` }}
                        title={`Strong Sell: ${recommendations.strongSell}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Strong Buy: {recommendations.strongBuy}</span>
                    <span>Buy: {recommendations.buy}</span>
                    <span>Hold: {recommendations.hold}</span>
                    <span>Sell: {recommendations.sell}</span>
                    <span>Strong Sell: {recommendations.strongSell}</span>
                  </div>
                </div>
              )}

              {/* Analysis Reasons */}
              <AnalysisReasons scoreData={score} modules={modules} />

              {/* Technical Indicators */}
              {analysis.stock.technical && (
                <TechnicalIndicators technical={analysis.stock.technical} />
              )}
            </div>
          )}

          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              {/* Range Selector */}
              <div className="flex gap-2">
                {(['1M', '3M', '6M', '1Y'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setChartRange(range)}
                    className={`px-3 py-1 text-sm rounded ${
                      chartRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Candlestick Chart */}
              <CandlestickChart data={getFilteredChartData()} height={400} showVolume />

              {/* Technical Indicators below chart */}
              {analysis.stock.technical && (
                <TechnicalIndicators technical={analysis.stock.technical} compact />
              )}
            </div>
          )}

          {/* Fundamentals Tab */}
          {activeTab === 'fundamentals' && (
            <div className="space-y-4">
              {/* Valuation Metrics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Valuation</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="P/E Ratio" value={metrics?.peRatio?.toFixed(1)} rawValue={metrics?.peRatio} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.peRatio?.toFixed(1))} />
                  <MetricCard label="Forward P/E" value={metrics?.peForward?.toFixed(1)} rawValue={metrics?.peForward} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.peForward?.toFixed(1))} />
                  <MetricCard label="P/B Ratio" value={metrics?.pbRatio?.toFixed(2)} rawValue={metrics?.pbRatio} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.pbRatio?.toFixed(2))} />
                  <MetricCard label="P/S Ratio" value={metrics?.psRatio?.toFixed(2)} rawValue={metrics?.psRatio} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.psRatio?.toFixed(2))} />
                  <MetricCard label="EV/EBITDA" value={metrics?.evEbitda?.toFixed(1)} rawValue={metrics?.evEbitda} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.evEbitda?.toFixed(1))} />
                  <MetricCard label="PEG Ratio" value={metrics?.pegRatio?.toFixed(2)} rawValue={metrics?.pegRatio} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.pegRatio?.toFixed(2))} />
                </div>
              </div>

              {/* Profitability */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Profitability</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="EPS" value={metrics?.eps ? `$${metrics.eps.toFixed(2)}` : undefined} rawValue={metrics?.eps} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.eps ? `$${metrics.eps.toFixed(2)}` : undefined)} />
                  <MetricCard label="Net Margin" value={metrics?.netMargin ? `${(metrics.netMargin * 100).toFixed(1)}%` : undefined} rawValue={metrics?.netMargin} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.netMargin ? `${(metrics.netMargin * 100).toFixed(1)}%` : undefined)} />
                  <MetricCard label="ROE" value={metrics?.roe ? `${(metrics.roe * 100).toFixed(1)}%` : undefined} rawValue={metrics?.roe} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.roe ? `${(metrics.roe * 100).toFixed(1)}%` : undefined)} />
                  <MetricCard label="ROA" value={metrics?.roa ? `${(metrics.roa * 100).toFixed(1)}%` : undefined} rawValue={metrics?.roa} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.roa ? `${(metrics.roa * 100).toFixed(1)}%` : undefined)} />
                </div>
              </div>

              {/* Growth */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Growth</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard
                    label="Revenue Growth"
                    value={metrics?.revenueGrowth ? `${(metrics.revenueGrowth * 100).toFixed(1)}%` : undefined}
                    rawValue={metrics?.revenueGrowth}
                    positive={metrics?.revenueGrowth ? metrics.revenueGrowth > 0 : undefined}
                    onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.revenueGrowth ? `${(metrics.revenueGrowth * 100).toFixed(1)}%` : undefined)}
                  />
                  <MetricCard
                    label="EPS Growth"
                    value={metrics?.epsGrowth ? `${(metrics.epsGrowth * 100).toFixed(1)}%` : undefined}
                    rawValue={metrics?.epsGrowth}
                    positive={metrics?.epsGrowth ? metrics.epsGrowth > 0 : undefined}
                    onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.epsGrowth ? `${(metrics.epsGrowth * 100).toFixed(1)}%` : undefined)}
                  />
                </div>
              </div>

              {/* Financial Health */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Health</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Debt/Equity" value={metrics?.debtToEquity?.toFixed(2)} rawValue={metrics?.debtToEquity} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.debtToEquity?.toFixed(2))} />
                  <MetricCard label="Current Ratio" value={metrics?.currentRatio?.toFixed(2)} rawValue={metrics?.currentRatio} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.currentRatio?.toFixed(2))} />
                  <MetricCard label="Quick Ratio" value={metrics?.quickRatio?.toFixed(2)} rawValue={metrics?.quickRatio} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.quickRatio?.toFixed(2))} />
                  <MetricCard label="Free Cash Flow" value={metrics?.freeCashflow ? formatLargeNumber(metrics.freeCashflow) : undefined} rawValue={metrics?.freeCashflow} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.freeCashflow ? formatLargeNumber(metrics.freeCashflow) : undefined)} />
                </div>
              </div>

              {/* Dividends */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Dividends</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Dividend Yield" value={metrics?.dividendYield ? `${metrics.dividendYield.toFixed(2)}%` : undefined} rawValue={metrics?.dividendYield} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.dividendYield ? `${metrics.dividendYield.toFixed(2)}%` : undefined)} />
                  <MetricCard label="Payout Ratio" value={metrics?.payoutRatio ? `${(metrics.payoutRatio * 100).toFixed(0)}%` : undefined} rawValue={metrics?.payoutRatio} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.payoutRatio ? `${(metrics.payoutRatio * 100).toFixed(0)}%` : undefined)} />
                </div>
              </div>

              {/* Risk Metrics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Beta" value={metrics?.beta?.toFixed(2)} rawValue={metrics?.beta} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.beta?.toFixed(2))} />
                  <MetricCard label="Short % Float" value={metrics?.shortPercentOfFloat ? `${(metrics.shortPercentOfFloat * 100).toFixed(1)}%` : undefined} rawValue={metrics?.shortPercentOfFloat} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.shortPercentOfFloat ? `${(metrics.shortPercentOfFloat * 100).toFixed(1)}%` : undefined)} />
                  <MetricCard label="Inst. Ownership" value={metrics?.heldPercentInstitutions ? `${(metrics.heldPercentInstitutions * 100).toFixed(0)}%` : undefined} rawValue={metrics?.heldPercentInstitutions} onInfoClick={(l, r) => handleMetricClick(l, r, metrics?.heldPercentInstitutions ? `${(metrics.heldPercentInstitutions * 100).toFixed(0)}%` : undefined)} />
                </div>
              </div>
            </div>
          )}

          {/* Metric Info Modal */}
          {activeMetricModal && (
            <MetricInfoModal
              metricKey={activeMetricModal.key}
              rawValue={activeMetricModal.rawValue}
              displayValue={activeMetricModal.displayValue}
              onClose={() => setActiveMetricModal(null)}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 rounded-b-lg">
          <div className="flex gap-3">
            <button
              onClick={() => onAddToWatchlist(stock.symbol)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isInWatchlist
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Helper component for metric display with info icon
const MetricCard: React.FC<{
  label: string;
  value?: string;
  rawValue?: number;
  positive?: boolean;
  onInfoClick?: (label: string, rawValue?: number) => void;
}> = ({ label, value, rawValue, positive, onInfoClick }) => (
  <div className="bg-gray-50 rounded-lg p-3 relative group">
    <div className="flex items-center justify-between">
      <div className="text-xs text-gray-500">{label}</div>
      {onInfoClick && METRIC_EXPLANATIONS[label] && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick(label, rawValue);
          }}
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
          title={`Learn about ${label}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </div>
    <div
      className={`text-lg font-semibold ${
        positive === true ? 'text-green-600' : positive === false ? 'text-red-600' : 'text-gray-900'
      }`}
    >
      {value || '—'}
    </div>
  </div>
);

// Modal component for metric explanations with value assessment
const MetricInfoModal: React.FC<{
  metricKey: string;
  rawValue?: number;
  displayValue?: string;
  onClose: () => void;
}> = ({ metricKey, rawValue, displayValue, onClose }) => {
  const metric = METRIC_EXPLANATIONS[metricKey];
  const assessment = assessMetricValue(metricKey, rawValue);

  if (!metric) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur rounded-2xl max-w-lg w-full shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">{metric.title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Current Value Assessment - THE KEY FEATURE */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{assessment.emoji}</span>
              <div>
                <div className="text-sm text-gray-500">Current Value</div>
                <div className="text-2xl font-bold text-gray-900">{displayValue || '—'}</div>
              </div>
            </div>
            <div className={`text-sm font-medium ${assessment.color} mt-2 p-2 bg-white rounded-lg`}>
              {assessment.verdict}
            </div>
          </div>

          {/* What is it */}
          <div>
            <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">What is it?</h4>
            <p className="text-gray-700 leading-relaxed">{metric.description}</p>
          </div>

          {/* How to interpret */}
          <div>
            <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">Value Ranges</h4>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm bg-gray-50 rounded-lg p-3">
              {metric.interpretation}
            </div>
          </div>

          {/* How investors use it */}
          <div>
            <h4 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">Pro Tip</h4>
            <p className="text-gray-700 leading-relaxed">{metric.usage}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// Format large numbers
function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

StockDetailView.displayName = 'StockDetailView';

export default StockDetailView;
