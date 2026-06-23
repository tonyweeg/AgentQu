/**
 * Financial Content Renderer
 * Carried - Motions carry, memory too
 *
 * Detects and renders financial data (credit card statements, check runs, etc.)
 * with visual charts instead of raw text
 */

import { useMemo } from 'react';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRightLeft,
  Calendar,
  Receipt,
} from 'lucide-react';

interface FinancialData {
  type: 'credit_card' | 'check_run' | 'budget' | 'unknown';
  previousBalance?: number;
  payments?: number;
  purchases?: number;
  newBalance?: number;
  creditLimit?: number;
  availableCredit?: number;
  minimumPayment?: number;
  dueDate?: string;
  transactions?: Array<{ vendor: string; amount: number; date?: string }>;
  statementDate?: string;
}

interface FinancialContentProps {
  content: string;
  className?: string;
}

// Parse financial data from text content
function parseFinancialData(content: string): FinancialData | null {
  const text = content.toLowerCase();

  // Detect credit card statement patterns
  if (
    text.includes('previous balance') ||
    text.includes('new balance') ||
    text.includes('credit limit') ||
    text.includes('available credit')
  ) {
    const data: FinancialData = { type: 'credit_card' };

    // Extract values using regex
    const patterns = {
      previousBalance: /previous balance[:\s]*\$?([\d,]+\.?\d*)/i,
      payments: /payments[:\s]*\$?([\d,]+\.?\d*)/i,
      purchases: /purchases[:\s]*\$?([\d,]+\.?\d*)/i,
      newBalance: /new balance[:\s]*\$?([\d,]+\.?\d*)/i,
      creditLimit: /credit limit[:\s]*\$?([\d,]+\.?\d*)/i,
      availableCredit: /available credit[:\s]*\$?([\d,]+\.?\d*)/i,
      minimumPayment: /minimum payment[:\s]*(due[:\s]*)?\$?([\d,]+\.?\d*)/i,
      dueDate: /(?:payment )?due date[:\s]*([a-z]+ \d+,? \d*|\d+\/\d+\/?\d*)/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        const value = match[1] || match[2];
        if (key === 'dueDate') {
          data[key] = value;
        } else if (key === 'minimumPayment') {
          data[key] = parseFloat((match[2] || match[1]).replace(/,/g, ''));
        } else {
          (data as any)[key] = parseFloat(value.replace(/,/g, ''));
        }
      }
    }

    // Extract transactions (look for vendor patterns with amounts)
    const transactionPattern = /([A-Z][A-Z\s\*\#\d]+(?:INC|LLC|CO|MD|WA)?)\s+\$?([\d,]+\.?\d*)\s+(?:on\s+)?(\d+\/\d+)?/gi;
    const transactions: Array<{ vendor: string; amount: number; date?: string }> = [];
    let txMatch;
    while ((txMatch = transactionPattern.exec(content)) !== null) {
      const vendor = txMatch[1].trim();
      const amount = parseFloat(txMatch[2].replace(/,/g, ''));
      if (vendor.length > 3 && amount > 0 && amount < 100000) {
        transactions.push({
          vendor,
          amount,
          date: txMatch[3] || undefined,
        });
      }
    }
    if (transactions.length > 0) {
      // Dedupe and limit to top transactions
      const seen = new Set<string>();
      data.transactions = transactions
        .filter(t => {
          const key = `${t.vendor}-${t.amount}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 8);
    }

    // Extract statement date
    const dateMatch = content.match(/(?:statement|ending)\s+([a-z]+\s+\d+,?\s*\d*)/i);
    if (dateMatch) {
      data.statementDate = dateMatch[1];
    }

    // Only return if we found meaningful data
    if (data.previousBalance || data.newBalance || data.creditLimit) {
      return data;
    }
  }

  return null;
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

// Simple horizontal bar component
function HorizontalBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Credit utilization gauge
function CreditUtilization({ used, limit }: { used: number; limit: number }) {
  const percentage = Math.min(100, (used / limit) * 100);
  const getColor = () => {
    if (percentage < 30) return 'text-green-600 dark:text-green-400';
    if (percentage < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  const getBgColor = () => {
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Credit Utilization</span>
        <span className={`text-sm font-bold ${getColor()}`}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getBgColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        <span>$0</span>
        <span>{formatCurrency(limit)}</span>
      </div>
    </div>
  );
}

export function FinancialContent({ content, className = '' }: FinancialContentProps) {
  const financialData = useMemo(() => parseFinancialData(content), [content]);

  // If no financial data detected, return null (caller should fall back to raw text)
  if (!financialData) {
    return null;
  }

  const maxValue = Math.max(
    financialData.previousBalance || 0,
    financialData.newBalance || 0,
    financialData.creditLimit || 0,
    financialData.purchases || 0,
    financialData.payments || 0
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>Credit Card Statement</span>
        {financialData.statementDate && (
          <span className="text-gray-500 dark:text-gray-400">
            - Ending {financialData.statementDate}
          </span>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {financialData.previousBalance !== undefined && (
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <ArrowRightLeft className="w-3 h-3" />
              Previous Balance
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(financialData.previousBalance)}
            </div>
          </div>
        )}

        {financialData.payments !== undefined && financialData.payments > 0 && (
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mb-1">
              <TrendingDown className="w-3 h-3" />
              Payments
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              -{formatCurrency(financialData.payments)}
            </div>
          </div>
        )}

        {financialData.purchases !== undefined && financialData.purchases > 0 && (
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-1">
              <TrendingUp className="w-3 h-3" />
              Purchases
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              +{formatCurrency(financialData.purchases)}
            </div>
          </div>
        )}

        {financialData.newBalance !== undefined && (
          <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 mb-1">
              <DollarSign className="w-3 h-3" />
              New Balance
            </div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(financialData.newBalance)}
            </div>
          </div>
        )}
      </div>

      {/* Credit Utilization */}
      {financialData.creditLimit && financialData.newBalance && (
        <CreditUtilization used={financialData.newBalance} limit={financialData.creditLimit} />
      )}

      {/* Balance Flow Chart */}
      {(financialData.previousBalance || financialData.payments || financialData.purchases) && (
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
            Statement Activity
          </h4>
          <div className="space-y-3">
            {financialData.previousBalance !== undefined && (
              <HorizontalBar
                value={financialData.previousBalance}
                max={maxValue}
                color="bg-gray-400"
                label="Previous Balance"
              />
            )}
            {financialData.payments !== undefined && financialData.payments > 0 && (
              <HorizontalBar
                value={financialData.payments}
                max={maxValue}
                color="bg-green-500"
                label="Payments"
              />
            )}
            {financialData.purchases !== undefined && financialData.purchases > 0 && (
              <HorizontalBar
                value={financialData.purchases}
                max={maxValue}
                color="bg-red-500"
                label="Purchases"
              />
            )}
            {financialData.newBalance !== undefined && (
              <HorizontalBar
                value={financialData.newBalance}
                max={maxValue}
                color="bg-indigo-500"
                label="New Balance"
              />
            )}
          </div>
        </div>
      )}

      {/* Credit Info */}
      {(financialData.creditLimit || financialData.availableCredit || financialData.minimumPayment || financialData.dueDate) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {financialData.creditLimit !== undefined && (
            <div className="text-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Credit Limit</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(financialData.creditLimit)}</div>
            </div>
          )}
          {financialData.availableCredit !== undefined && (
            <div className="text-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Available Credit</div>
              <div className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(financialData.availableCredit)}</div>
            </div>
          )}
          {financialData.minimumPayment !== undefined && (
            <div className="text-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Minimum Due</div>
              <div className="font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(financialData.minimumPayment)}</div>
            </div>
          )}
          {financialData.dueDate && (
            <div className="text-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Due Date</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3" />
                {financialData.dueDate}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {financialData.transactions && financialData.transactions.length > 0 && (
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Receipt className="w-3 h-3" />
            Transactions ({financialData.transactions.length})
          </h4>
          <div className="space-y-2">
            {financialData.transactions.map((tx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-600 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{tx.vendor}</span>
                  {tx.date && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{tx.date}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialContent;
