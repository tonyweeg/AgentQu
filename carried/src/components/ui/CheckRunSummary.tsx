/**
 * Check Run Summary Visualization
 * Carried - Motions carry, memory too
 *
 * Renders check run analysis summaries with charts and visual breakdowns
 */

import { useMemo, useState } from 'react';
import {
  DollarSign,
  Building2,
  PieChart,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
}

interface VendorData {
  name: string;
  amount: number;
  paymentCount: number;
}

interface CheckRunData {
  title?: string;
  description?: string;
  dateRange?: string;
  totalAP?: number;
  totalUtilityRefunds?: number;
  totalDisbursed?: number;
  vendorCount?: number;
  lineItemCount?: number;
  meetingCount?: number;
  categories: CategoryData[];
  topVendors: VendorData[];
}

interface CheckRunSummaryProps {
  content: string;
  className?: string;
}

// Color palette for categories
const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-lime-500',
  'bg-fuchsia-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-red-500',
  'bg-green-500',
];

// Parse check run summary from text
function parseCheckRunSummary(content: string): CheckRunData | null {
  // Check if this looks like a check run summary
  if (!content.includes('Spending by Category') && !content.includes('Top') && !content.includes('Vendors')) {
    return null;
  }

  const data: CheckRunData = {
    categories: [],
    topVendors: [],
  };

  // Extract total amounts from description
  const totalAPMatch = content.match(/Total AP Vendor Payments[^$]*\$([\d,]+\.?\d*)/i);
  if (totalAPMatch) {
    data.totalAP = parseFloat(totalAPMatch[1].replace(/,/g, ''));
  }

  const utilityMatch = content.match(/Utility Refunds[^$]*\$([\d,]+\.?\d*)/i);
  if (utilityMatch) {
    data.totalUtilityRefunds = parseFloat(utilityMatch[1].replace(/,/g, ''));
  }

  const disbursedMatch = content.match(/(?:combined total|total) disbursed[^$]*\$([\d,]+\.?\d*)/i);
  if (disbursedMatch) {
    data.totalDisbursed = parseFloat(disbursedMatch[1].replace(/,/g, ''));
  }

  const vendorCountMatch = content.match(/(\d+)\s*vendors/i);
  if (vendorCountMatch) {
    data.vendorCount = parseInt(vendorCountMatch[1]);
  }

  const lineItemMatch = content.match(/(\d+)\s*line items/i);
  if (lineItemMatch) {
    data.lineItemCount = parseInt(lineItemMatch[1]);
  }

  const meetingMatch = content.match(/(?:across|over)\s*(\d+)\s*(?:council\s*)?meetings/i);
  if (meetingMatch) {
    data.meetingCount = parseInt(meetingMatch[1]);
  }

  // Extract date range
  const dateMatch = content.match(/from\s+([A-Za-z]+\s+\d+,?\s+\d+)[,\s]+to\s+([A-Za-z]+\s+\d+,?\s+\d+)/i);
  if (dateMatch) {
    data.dateRange = `${dateMatch[1]} - ${dateMatch[2]}`;
  }

  // Parse categories: "- Category Name: $X,XXX.XX (XX.XX% of AP)"
  const categoryPattern = /[-•]\s*([^:$]+):\s*\$([\d,]+\.?\d*)\s*\((\d+\.?\d*)%/g;
  let match;
  while ((match = categoryPattern.exec(content)) !== null) {
    data.categories.push({
      name: match[1].trim(),
      amount: parseFloat(match[2].replace(/,/g, '')),
      percentage: parseFloat(match[3]),
    });
  }

  // Parse top vendors: "- VENDOR NAME: $X,XXX.XX (# Pmts: X)"
  const vendorPattern = /[-•]\s*([A-Z][A-Z\s\&\,\.]+?):\s*\$([\d,]+\.?\d*)\s*\(#?\s*Pmts?:?\s*(\d+)\)/g;
  while ((match = vendorPattern.exec(content)) !== null) {
    data.topVendors.push({
      name: match[1].trim(),
      amount: parseFloat(match[2].replace(/,/g, '')),
      paymentCount: parseInt(match[3]),
    });
  }

  // Only return if we found meaningful data
  if (data.categories.length > 0 || data.topVendors.length > 0) {
    return data;
  }

  return null;
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function CheckRunSummary({ content, className = '' }: CheckRunSummaryProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllVendors, setShowAllVendors] = useState(false);

  const data = useMemo(() => parseCheckRunSummary(content), [content]);

  if (!data) {
    return null;
  }

  const displayCategories = showAllCategories ? data.categories : data.categories.slice(0, 8);
  const displayVendors = showAllVendors ? data.topVendors : data.topVendors.slice(0, 10);
  const maxCategoryAmount = Math.max(...data.categories.map(c => c.amount), 1);
  const maxVendorAmount = Math.max(...data.topVendors.map(v => v.amount), 1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5" />
          <h3 className="font-bold text-lg">Check Run Analysis</h3>
          {data.dateRange && (
            <span className="text-emerald-100 text-sm ml-2">({data.dateRange})</span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.totalDisbursed && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Total Disbursed
              </div>
              <div className="text-2xl font-bold">{formatCurrency(data.totalDisbursed)}</div>
            </div>
          )}
          {data.totalAP && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                AP Payments
              </div>
              <div className="text-xl font-bold">{formatCurrency(data.totalAP)}</div>
            </div>
          )}
          {data.vendorCount && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Vendors
              </div>
              <div className="text-xl font-bold">{data.vendorCount}</div>
            </div>
          )}
          {data.meetingCount && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Meetings
              </div>
              <div className="text-xl font-bold">{data.meetingCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Chart */}
      {data.categories.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Spending by Category</h4>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {data.categories.length} categories
            </span>
          </div>

          {/* Visual Bar Chart */}
          <div className="space-y-3">
            {displayCategories.map((cat, idx) => (
              <div key={cat.name} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-sm ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatFullCurrency(cat.amount)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`}
                    style={{ width: `${(cat.amount / maxCategoryAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {data.categories.length > 8 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="mt-4 flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              {showAllCategories ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show all {data.categories.length} categories
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Top Vendors */}
      {data.topVendors.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Top Vendors</h4>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              by total paid
            </span>
          </div>

          <div className="space-y-3">
            {displayVendors.map((vendor, idx) => (
              <div key={vendor.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {vendor.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2 flex-shrink-0">
                      {formatFullCurrency(vendor.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(vendor.amount / maxVendorAmount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {vendor.paymentCount} pmt{vendor.paymentCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.topVendors.length > 10 && (
            <button
              onClick={() => setShowAllVendors(!showAllVendors)}
              className="mt-4 flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              {showAllVendors ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show all {data.topVendors.length} vendors
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckRunSummary;
