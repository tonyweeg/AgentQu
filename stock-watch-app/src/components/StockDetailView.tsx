import React, { useState, memo } from 'react';
import { Stock, ScoreData, AnalysisModule } from '../lib/types';
import CandlestickChart from './CandlestickChart';
import PriceTargetIndicator from './PriceTargetIndicator';
import AnalysisReasons from './AnalysisReasons';
import TechnicalIndicators from './TechnicalIndicators';

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
                  <MetricCard label="P/E Ratio" value={metrics?.peRatio?.toFixed(1)} />
                  <MetricCard label="Forward P/E" value={metrics?.peForward?.toFixed(1)} />
                  <MetricCard label="P/B Ratio" value={metrics?.pbRatio?.toFixed(2)} />
                  <MetricCard label="P/S Ratio" value={metrics?.psRatio?.toFixed(2)} />
                  <MetricCard label="EV/EBITDA" value={metrics?.evEbitda?.toFixed(1)} />
                  <MetricCard label="PEG Ratio" value={metrics?.pegRatio?.toFixed(2)} />
                </div>
              </div>

              {/* Profitability */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Profitability</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="EPS" value={metrics?.eps ? `$${metrics.eps.toFixed(2)}` : undefined} />
                  <MetricCard label="Net Margin" value={metrics?.netMargin ? `${(metrics.netMargin * 100).toFixed(1)}%` : undefined} />
                  <MetricCard label="ROE" value={metrics?.roe ? `${(metrics.roe * 100).toFixed(1)}%` : undefined} />
                  <MetricCard label="ROA" value={metrics?.roa ? `${(metrics.roa * 100).toFixed(1)}%` : undefined} />
                </div>
              </div>

              {/* Growth */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Growth</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard
                    label="Revenue Growth"
                    value={metrics?.revenueGrowth ? `${(metrics.revenueGrowth * 100).toFixed(1)}%` : undefined}
                    positive={metrics?.revenueGrowth ? metrics.revenueGrowth > 0 : undefined}
                  />
                  <MetricCard
                    label="EPS Growth"
                    value={metrics?.epsGrowth ? `${(metrics.epsGrowth * 100).toFixed(1)}%` : undefined}
                    positive={metrics?.epsGrowth ? metrics.epsGrowth > 0 : undefined}
                  />
                </div>
              </div>

              {/* Financial Health */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Financial Health</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Debt/Equity" value={metrics?.debtToEquity?.toFixed(2)} />
                  <MetricCard label="Current Ratio" value={metrics?.currentRatio?.toFixed(2)} />
                  <MetricCard label="Quick Ratio" value={metrics?.quickRatio?.toFixed(2)} />
                  <MetricCard label="Free Cash Flow" value={metrics?.freeCashflow ? formatLargeNumber(metrics.freeCashflow) : undefined} />
                </div>
              </div>

              {/* Dividends */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Dividends</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Dividend Yield" value={metrics?.dividendYield ? `${metrics.dividendYield.toFixed(2)}%` : undefined} />
                  <MetricCard label="Payout Ratio" value={metrics?.payoutRatio ? `${(metrics.payoutRatio * 100).toFixed(0)}%` : undefined} />
                </div>
              </div>

              {/* Risk Metrics */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard label="Beta" value={metrics?.beta?.toFixed(2)} />
                  <MetricCard label="Short % Float" value={metrics?.shortPercentOfFloat ? `${(metrics.shortPercentOfFloat * 100).toFixed(1)}%` : undefined} />
                  <MetricCard label="Inst. Ownership" value={metrics?.heldPercentInstitutions ? `${(metrics.heldPercentInstitutions * 100).toFixed(0)}%` : undefined} />
                </div>
              </div>
            </div>
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

// Helper component for metric display
const MetricCard: React.FC<{
  label: string;
  value?: string;
  positive?: boolean;
}> = ({ label, value, positive }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="text-xs text-gray-500">{label}</div>
    <div
      className={`text-lg font-semibold ${
        positive === true ? 'text-green-600' : positive === false ? 'text-red-600' : 'text-gray-900'
      }`}
    >
      {value || '—'}
    </div>
  </div>
);

// Format large numbers
function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

StockDetailView.displayName = 'StockDetailView';

export default StockDetailView;
