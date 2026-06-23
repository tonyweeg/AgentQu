/**
 * Financial Analytics Component
 * Carried - Motions carry, memory too
 *
 * Comprehensive financial analysis with statistics, trends, and Benford's Law
 */

import { useMemo, useState } from 'react';
import {
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Building2,
  Calculator,
  Eye,
} from 'lucide-react';
import { Segment } from '../../types';

interface FinancialTransaction {
  vendor: string;
  amount: number;
  date?: string;
  category?: string;
  description?: string;
  source: string; // Which segment it came from
}

interface FinancialStats {
  total: number;
  count: number;
  average: number;
  min: number;
  max: number;
  median: number;
  standardDeviation: number;
}

interface VendorSummary {
  vendor: string;
  total: number;
  count: number;
  average: number;
  transactions: FinancialTransaction[];
}

interface BenfordAnalysis {
  digit: number;
  expected: number;
  actual: number;
  deviation: number;
  isAnomaly: boolean;
}

interface FinancialAnalyticsProps {
  segments: Segment[];
}

// Phrases that indicate this is a summary line, not a real vendor
// These must match the FULL vendor field to be excluded
const SUMMARY_PHRASES = [
  'THE COMBINED DISBURSED TOTAL WAS',
  'AP VENDOR PAYMENTS TOTALED',
  'THE STATED TOTAL FROM PDF WAS',
  'TOTAL PAID',
  'GRAND TOTAL',
  'SUBTOTAL',
  'COMBINED TOTAL',
  'ACCOUNTS PAYABLE TOTAL',
  'CHECK RUN TOTAL',
  'IDENTICAL',
  'GENERAL',  // Category names, not vendors
  'PAYROLL, TAXES & BENEFITS',
  'VEHICLES, FLEET & EQUIPMENT',
  'UTILITIES',
  'PROFESSIONAL SERVICES',
  'MATERIALS & SUPPLIES',
];

// Parse all financial transactions from segments
function extractTransactions(segments: Segment[]): FinancialTransaction[] {
  const transactions: FinancialTransaction[] = [];

  for (const segment of segments) {
    const content = segment.content;

    // Primary pattern: "Vendor: X | ... | Total Paid: Y" or "Vendor: X | ... | Amount: Y"
    // This matches the Excel import format from the file parser
    const vendorAmountPattern = /Vendor[^:]*:\s*([^\|]+?)\s*\|.*?(?:Total Paid|Amount)[:\s]*\$?([\d,]+\.?\d{0,2})/gi;

    let match;

    while ((match = vendorAmountPattern.exec(content)) !== null) {
      const vendor = match[1].trim().replace(/\s+/g, ' ');
      const amount = parseFloat(match[2].replace(/,/g, ''));

      // Check if this is a summary phrase (exact or near match)
      const isSummary = SUMMARY_PHRASES.some(phrase =>
        vendor.toUpperCase().includes(phrase) ||
        phrase.includes(vendor.toUpperCase())
      );

      // Valid transaction criteria
      if (
        !isSummary &&
        amount > 0.01 &&
        amount < 1000000 &&
        vendor.length > 2 &&
        vendor.length < 80 &&
        // Exclude obvious non-vendors
        !vendor.match(/^(HEADERS|SHEET|===|---)/i)
      ) {
        // Avoid duplicates
        const normalizedVendor = vendor.toUpperCase();
        const exists = transactions.some(
          t => t.vendor.toUpperCase() === normalizedVendor &&
               Math.abs(t.amount - amount) < 0.01 &&
               t.source === segment.title
        );
        if (!exists) {
          transactions.push({
            vendor,
            amount,
            source: segment.title,
            category: segment.tags?.[0],
          });
        }
      }
    }

    // Secondary pattern: Look for credit card transactions
    // Format: "VENDOR NAME $123.45 on MM/DD"
    const creditCardPattern = /Transactions?:.*?([A-Z][A-Z\s\*\#\d\.\-]+?)\s+\$?([\d,]+\.\d{2})\s+on\s+\d+\/\d+/gi;
    while ((match = creditCardPattern.exec(content)) !== null) {
      const vendor = match[1].trim().replace(/\s+/g, ' ');
      const amount = parseFloat(match[2].replace(/,/g, ''));

      if (amount > 0.01 && amount < 100000 && vendor.length > 3) {
        const exists = transactions.some(
          t => t.vendor === vendor && t.amount === amount && t.source === segment.title
        );
        if (!exists) {
          transactions.push({
            vendor,
            amount,
            source: segment.title,
            category: 'credit_card',
          });
        }
      }
    }
  }

  return transactions;
}

// Calculate basic statistics
function calculateStats(amounts: number[]): FinancialStats {
  if (amounts.length === 0) {
    return { total: 0, count: 0, average: 0, min: 0, max: 0, median: 0, standardDeviation: 0 };
  }

  const sorted = [...amounts].sort((a, b) => a - b);
  const total = amounts.reduce((sum, a) => sum + a, 0);
  const count = amounts.length;
  const average = total / count;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)];

  // Standard deviation
  const squaredDiffs = amounts.map(a => Math.pow(a - average, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / count;
  const standardDeviation = Math.sqrt(avgSquaredDiff);

  return { total, count, average, min, max, median, standardDeviation };
}

// Group transactions by vendor
function groupByVendor(transactions: FinancialTransaction[]): VendorSummary[] {
  const groups: Record<string, FinancialTransaction[]> = {};

  for (const tx of transactions) {
    // Normalize vendor name
    const normalized = tx.vendor.toUpperCase().replace(/\s+/g, ' ').trim();
    if (!groups[normalized]) {
      groups[normalized] = [];
    }
    groups[normalized].push(tx);
  }

  return Object.entries(groups)
    .map(([vendor, txs]) => {
      const amounts = txs.map(t => t.amount);
      return {
        vendor,
        total: amounts.reduce((sum, a) => sum + a, 0),
        count: txs.length,
        average: amounts.reduce((sum, a) => sum + a, 0) / txs.length,
        transactions: txs,
      };
    })
    .sort((a, b) => b.total - a.total);
}

// Benford's Law analysis
// Expected distribution of first digits in naturally occurring numbers
const BENFORD_EXPECTED = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];

function analyzeBenford(amounts: number[]): BenfordAnalysis[] {
  if (amounts.length < 20) {
    return []; // Not enough data for meaningful analysis
  }

  // Count first digits
  const digitCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let validCount = 0;

  for (const amount of amounts) {
    const firstDigit = parseInt(String(amount).replace(/[^0-9]/g, '').charAt(0));
    if (firstDigit >= 1 && firstDigit <= 9) {
      digitCounts[firstDigit]++;
      validCount++;
    }
  }

  if (validCount < 20) return [];

  // Calculate actual percentages and deviations
  const analysis: BenfordAnalysis[] = [];

  for (let digit = 1; digit <= 9; digit++) {
    const actual = digitCounts[digit] / validCount;
    const expected = BENFORD_EXPECTED[digit];
    const deviation = Math.abs(actual - expected);
    // Flag as anomaly if deviation > 5% (significant departure from expected)
    const isAnomaly = deviation > 0.05;

    analysis.push({
      digit,
      expected,
      actual,
      deviation,
      isAnomaly,
    });
  }

  return analysis;
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Horizontal bar for visualization
function HorizontalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function FinancialAnalytics({ segments }: FinancialAnalyticsProps) {
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [showBenford, setShowBenford] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  // Extract and analyze transactions
  const analysis = useMemo(() => {
    const transactions = extractTransactions(segments);
    const amounts = transactions.map(t => t.amount);
    const stats = calculateStats(amounts);
    const vendorSummaries = groupByVendor(transactions);
    const benfordAnalysis = analyzeBenford(amounts);

    // Count anomalies in Benford analysis
    const benfordAnomalies = benfordAnalysis.filter(b => b.isAnomaly).length;
    const benfordScore = benfordAnalysis.length > 0
      ? (1 - benfordAnomalies / benfordAnalysis.length) * 100
      : null;

    return {
      transactions,
      stats,
      vendorSummaries,
      benfordAnalysis,
      benfordScore,
      hasData: transactions.length > 0,
    };
  }, [segments]);

  // Don't render if no financial data
  if (!analysis.hasData) {
    return null;
  }

  const topVendors = analysis.vendorSummaries.slice(0, 10);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Financial Analytics</h2>
              <p className="text-emerald-100 text-sm">
                {analysis.transactions.length} transactions analyzed
              </p>
            </div>
          </div>
          {analysis.benfordScore !== null && (
            <div className="text-right">
              <div className="text-xs text-emerald-100">Benford Score</div>
              <div className={`text-xl font-bold ${
                analysis.benfordScore >= 80 ? 'text-white' :
                analysis.benfordScore >= 60 ? 'text-yellow-200' :
                'text-red-200'
              }`}>
                {analysis.benfordScore.toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 dark:border-slate-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
            <DollarSign className="w-3 h-3" />
            Total Disbursed
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(analysis.stats.total)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
            <Calculator className="w-3 h-3" />
            Average
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(analysis.stats.average)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
            <ArrowDownRight className="w-3 h-3 text-green-500" />
            Min
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(analysis.stats.min)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
            <ArrowUpRight className="w-3 h-3 text-red-500" />
            Max
          </div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(analysis.stats.max)}
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Median</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(analysis.stats.median)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Std Deviation</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(analysis.stats.standardDeviation)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Unique Vendors</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {analysis.vendorSummaries.length}
          </div>
        </div>
      </div>

      {/* Top Vendors */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-700">
        <button
          onClick={() => setShowVendorDetails(!showVendorDetails)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Top Vendors</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              (click for details)
            </span>
          </div>
          {showVendorDetails ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <div className="space-y-3">
          {topVendors.map((vendor, idx) => (
            <div key={vendor.vendor}>
              <div
                className={`flex items-center gap-3 ${showVendorDetails ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 -m-2 rounded-lg' : ''}`}
                onClick={() => showVendorDetails && setExpandedVendor(
                  expandedVendor === vendor.vendor ? null : vendor.vendor
                )}
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {vendor.vendor}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">
                      {formatCurrency(vendor.total)}
                    </span>
                  </div>
                  <HorizontalBar
                    value={vendor.total}
                    max={analysis.stats.total}
                    color="bg-indigo-500"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{vendor.count} payment{vendor.count !== 1 ? 's' : ''}</span>
                    <span>{formatPercent(vendor.total / analysis.stats.total)} of total</span>
                  </div>
                </div>
              </div>

              {/* Expanded vendor details */}
              {showVendorDetails && expandedVendor === vendor.vendor && (
                <div className="ml-9 mt-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Payment History
                  </div>
                  <div className="space-y-1">
                    {vendor.transactions.slice(0, 10).map((tx, txIdx) => (
                      <div key={txIdx} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                          {tx.source}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 ml-2">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                    {vendor.transactions.length > 10 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        +{vendor.transactions.length - 10} more
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600 flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Average payment:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(vendor.average)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {analysis.vendorSummaries.length > 10 && !showVendorDetails && (
            <button
              onClick={() => setShowVendorDetails(true)}
              className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              View all {analysis.vendorSummaries.length} vendors
            </button>
          )}
        </div>
      </div>

      {/* Benford's Law Analysis */}
      {analysis.benfordAnalysis.length > 0 && (
        <div className="p-6">
          <button
            onClick={() => setShowBenford(!showBenford)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Benford's Law Analysis</h3>
              {analysis.benfordAnalysis.some(b => b.isAnomaly) ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Anomalies detected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Normal distribution
                </span>
              )}
            </div>
            {showBenford ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showBenford && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Benford's Law predicts the frequency of leading digits in naturally occurring numbers.
                Significant deviations may indicate data manipulation or irregularities.
              </p>

              <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                {analysis.benfordAnalysis.map(b => (
                  <div
                    key={b.digit}
                    className={`text-center p-2 rounded-lg border ${
                      b.isAnomaly
                        ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700'
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{b.digit}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Expected: {formatPercent(b.expected)}
                    </div>
                    <div className={`text-sm font-medium ${
                      b.isAnomaly ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Actual: {formatPercent(b.actual)}
                    </div>
                    {b.isAnomaly && (
                      <AlertTriangle className="w-3 h-3 text-amber-500 mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
                <strong>How to interpret:</strong> A deviation greater than 5% from expected values
                is flagged. This doesn't necessarily indicate fraud, but may warrant further review.
                Common legitimate causes include: small sample sizes, data from restricted ranges,
                or rounded figures.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FinancialAnalytics;
