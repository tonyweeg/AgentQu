/**
 * Disbursement Summary Visualization
 * Carried - Motions carry, memory too
 *
 * Renders disbursement summary reports with visual breakdowns
 * Shows actual vendor line items, credit cards, and interfund transfers
 */

import { useMemo, useState } from 'react';
import {
  DollarSign,
  Building2,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Receipt,
  Zap,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Package,
  ArrowLeftRight,
} from 'lucide-react';

interface VendorLineItem {
  vendor: string;
  category: string;
  amount: number;
  description: string;
}

interface CreditCardItem {
  cardholder: string;
  balance: number;
}

interface InterfundTransfer {
  from: string;
  to: string;
  amount: number;
  description: string;
}

interface DisbursementData {
  meetingDate?: string;
  apVendorPayments?: number;
  vendorLineCount?: number;
  utilityRefunds?: number;
  combinedTotal?: number;
  pdfStatedTotal?: number;
  reconciliationStatus?: 'OK' | 'MISMATCH' | 'UNKNOWN';
  vendorLineItems: VendorLineItem[];
  creditCards: CreditCardItem[];
  interfundTransfers: InterfundTransfer[];
}

interface DisbursementSummaryProps {
  content: string;
  rawMinutes?: string;
  className?: string;
}

// Parse disbursement summary from segment content AND raw meeting data
function parseDisbursementSummary(content: string, rawMinutes?: string): DisbursementData | null {
  // Check if this looks like a disbursement summary
  if (!content.includes('Disbursement') && !content.includes('disbursed')) {
    return null;
  }

  const data: DisbursementData = {
    vendorLineItems: [],
    creditCards: [],
    interfundTransfers: [],
  };

  // Extract meeting date from segment content
  const dateMatch = content.match(/(?:Meeting Date|meeting on)\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/i);
  if (dateMatch) {
    data.meetingDate = dateMatch[1];
  }

  // Extract AP Vendor Payments total and count
  const apMatch = content.match(/AP Vendor Payments[^$]*\$([\d,]+\.?\d*)\s*(?:across|with)?\s*(\d+)?\s*vendor/i);
  if (apMatch) {
    data.apVendorPayments = parseFloat(apMatch[1].replace(/,/g, ''));
    if (apMatch[2]) {
      data.vendorLineCount = parseInt(apMatch[2]);
    }
  }

  // Extract Utility Refunds
  const utilityMatch = content.match(/Utility Refunds[^$]*\$([\d,]+\.?\d*)/i);
  if (utilityMatch) {
    data.utilityRefunds = parseFloat(utilityMatch[1].replace(/,/g, ''));
  }

  // Extract combined disbursed total
  const combinedMatch = content.match(/(?:combined|total)\s*disbursed[^$]*\$([\d,]+\.?\d*)/i);
  if (combinedMatch) {
    data.combinedTotal = parseFloat(combinedMatch[1].replace(/,/g, ''));
  }

  // Extract PDF stated total
  const pdfMatch = content.match(/(?:stated total|PDF|from PDF)[^$]*\$([\d,]+\.?\d*)/i);
  if (pdfMatch) {
    data.pdfStatedTotal = parseFloat(pdfMatch[1].replace(/,/g, ''));
  }

  // Extract reconciliation status
  if (content.toLowerCase().includes('reconciliation status was ok') ||
      content.toLowerCase().includes('reconciliation: ok') ||
      content.toLowerCase().includes('status was ok')) {
    data.reconciliationStatus = 'OK';
  } else if (content.toLowerCase().includes('mismatch') ||
             content.toLowerCase().includes('discrepancy')) {
    data.reconciliationStatus = 'MISMATCH';
  } else {
    data.reconciliationStatus = 'UNKNOWN';
  }

  // If we have raw minutes, extract the actual line items for this meeting date
  if (rawMinutes && data.meetingDate) {
    const normalizedDate = data.meetingDate.replace(/\//g, '.');

    // Parse vendor line items from raw data
    // Format: "Meeting Date: XX.XX.XXXX | Vendor (as printed): NAME | Category: CAT | Amount: XXX | Description: DESC"
    const lines = rawMinutes.split('\n');

    for (const line of lines) {
      // Check if this line is for our meeting date
      if (line.includes(normalizedDate) || line.includes(data.meetingDate)) {
        // Parse pipe-delimited format from Excel parser
        const parts = line.split(' | ');
        const lineData: Record<string, string> = {};

        for (const part of parts) {
          const colonIdx = part.indexOf(':');
          if (colonIdx > 0) {
            const key = part.substring(0, colonIdx).trim().toLowerCase();
            const value = part.substring(colonIdx + 1).trim();
            lineData[key] = value;
          }
        }

        // Check if this is a vendor line item
        if (lineData['vendor (as printed)'] || lineData['vendor (normalized)'] || lineData['vendor']) {
          const vendor = lineData['vendor (as printed)'] || lineData['vendor (normalized)'] || lineData['vendor'] || '';
          const category = lineData['category'] || 'Uncategorized';
          const amount = parseFloat((lineData['amount'] || '0').replace(/[$,]/g, ''));
          const description = lineData['description'] || '';

          if (vendor && amount > 0) {
            // Check if this is an interfund transfer
            if (category.toLowerCase().includes('interfund') ||
                category.toLowerCase().includes('transfer') ||
                vendor.toLowerCase().includes('town of berlin')) {
              data.interfundTransfers.push({
                from: 'General Fund',
                to: vendor,
                amount: amount,
                description: description,
              });
            } else {
              data.vendorLineItems.push({
                vendor: vendor,
                category: category,
                amount: amount,
                description: description,
              });
            }
          }
        }

        // Check if this is a credit card line
        if (lineData['cardholder / account'] || lineData['cardholder']) {
          const cardholder = lineData['cardholder / account'] || lineData['cardholder'] || '';
          const balance = parseFloat((lineData['new balance'] || lineData['balance'] || '0').replace(/[$,]/g, ''));

          if (cardholder && balance > 0) {
            data.creditCards.push({
              cardholder: cardholder,
              balance: balance,
            });
          }
        }
      }
    }
  }

  // Only return if we found meaningful data
  if (data.apVendorPayments || data.combinedTotal || data.utilityRefunds) {
    return data;
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

export function DisbursementSummary({ content, rawMinutes, className = '' }: DisbursementSummaryProps) {
  const [showAllVendors, setShowAllVendors] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);
  const [showAllTransfers, setShowAllTransfers] = useState(false);

  const data = useMemo(() => parseDisbursementSummary(content, rawMinutes), [content, rawMinutes]);

  if (!data) {
    return null;
  }

  const reconciliationColor = data.reconciliationStatus === 'OK'
    ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
    : data.reconciliationStatus === 'MISMATCH'
      ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
      : 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';

  // Calculate percentage breakdown if we have the data
  const hasBreakdown = data.apVendorPayments && data.utilityRefunds && data.combinedTotal;
  const apPercentage = hasBreakdown ? (data.apVendorPayments! / data.combinedTotal!) * 100 : 0;
  const utilityPercentage = hasBreakdown ? (data.utilityRefunds! / data.combinedTotal!) * 100 : 0;

  // Group vendors by category (excluding interfund)
  const vendorsByCategory = data.vendorLineItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, VendorLineItem[]>);

  // Sort categories by total amount
  const sortedCategories = Object.entries(vendorsByCategory)
    .map(([category, items]) => ({
      category,
      items,
      total: items.reduce((sum, item) => sum + item.amount, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const displayVendors = showAllVendors
    ? data.vendorLineItems
    : data.vendorLineItems.slice(0, 10);

  const displayCards = showAllCards
    ? data.creditCards
    : data.creditCards.slice(0, 5);

  const displayTransfers = showAllTransfers
    ? data.interfundTransfers
    : data.interfundTransfers.slice(0, 5);

  const totalCreditCards = data.creditCards.reduce((sum, card) => sum + card.balance, 0);
  const totalInterfund = data.interfundTransfers.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with date and reconciliation status */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <h3 className="font-bold text-lg">Disbursement Summary</h3>
          </div>
          {data.meetingDate && (
            <div className="flex items-center gap-1 text-blue-100 text-sm">
              <Calendar className="w-4 h-4" />
              {data.meetingDate}
            </div>
          )}
        </div>

        {/* Main totals grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.combinedTotal && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Total Disbursed
              </div>
              <div className="text-2xl font-bold">{formatCurrency(data.combinedTotal)}</div>
            </div>
          )}
          {data.apVendorPayments && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                AP Vendor Payments
              </div>
              <div className="text-xl font-bold">{formatCurrency(data.apVendorPayments)}</div>
            </div>
          )}
          {data.utilityRefunds !== undefined && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Utility Refunds
              </div>
              <div className="text-xl font-bold">{formatCurrency(data.utilityRefunds)}</div>
            </div>
          )}
          {data.vendorLineCount && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-blue-100 text-xs flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                Vendor Lines
              </div>
              <div className="text-xl font-bold">{data.vendorLineCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Breakdown Chart */}
      {hasBreakdown && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Breakdown</h4>

          {/* Stacked bar chart */}
          <div className="h-8 rounded-full overflow-hidden flex mb-4">
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${apPercentage}%` }}
            >
              {apPercentage > 15 && `${apPercentage.toFixed(1)}%`}
            </div>
            <div
              className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${utilityPercentage}%` }}
            >
              {utilityPercentage > 5 && `${utilityPercentage.toFixed(1)}%`}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">AP Vendor Payments</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(data.apVendorPayments!)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-gray-700 dark:text-gray-300">Utility Refunds</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(data.utilityRefunds!)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interfund Transfers Section - Highlighted */}
      {data.interfundTransfers.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 border-2 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Interfund Transfers</h4>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">{data.interfundTransfers.length} transfers</div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalInterfund)}</div>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-200 dark:border-orange-800">
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">To</th>
                  <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {displayTransfers.map((transfer, idx) => (
                  <tr key={idx} className="border-b border-orange-100 dark:border-orange-900/50 hover:bg-orange-100/50 dark:hover:bg-orange-900/30">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                          {transfer.from}
                        </span>
                        <ArrowLeftRight className="w-3 h-3 text-orange-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{transfer.to}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(transfer.amount)}
                    </td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell truncate max-w-xs">
                      {transfer.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.interfundTransfers.length > 5 && (
            <button
              onClick={() => setShowAllTransfers(!showAllTransfers)}
              className="mt-3 flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
            >
              {showAllTransfers ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show all {data.interfundTransfers.length} transfers
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Vendor Line Items Table */}
      {data.vendorLineItems.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Vendor Line Items</h4>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {data.vendorLineItems.length} items
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Vendor</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Category</th>
                  <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {displayVendors.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="py-2 px-2 text-gray-900 dark:text-gray-100 font-medium">{item.vendor}</td>
                    <td className="py-2 px-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">{formatCurrency(item.amount)}</td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell truncate max-w-xs">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.vendorLineItems.length > 10 && (
            <button
              onClick={() => setShowAllVendors(!showAllVendors)}
              className="mt-4 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {showAllVendors ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show all {data.vendorLineItems.length} items
                </>
              )}
            </button>
          )}

          {/* Category Summary */}
          {sortedCategories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">By Category</h5>
              <div className="space-y-2">
                {sortedCategories.slice(0, 5).map(({ category, items, total }) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                      <span className="text-xs text-gray-400">({items.length} items)</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Credit Cards Section */}
      {data.creditCards.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Credit Card Balances</h4>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">{data.creditCards.length} accounts</div>
              <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalCreditCards)}</div>
            </div>
          </div>

          <div className="space-y-2">
            {displayCards.map((card, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700/50 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{card.cardholder}</span>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(card.balance)}</span>
              </div>
            ))}
          </div>

          {data.creditCards.length > 5 && (
            <button
              onClick={() => setShowAllCards(!showAllCards)}
              className="mt-3 flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              {showAllCards ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show all {data.creditCards.length} accounts
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Reconciliation status */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.reconciliationStatus === 'OK' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : data.reconciliationStatus === 'MISMATCH' ? (
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            ) : (
              <FileCheck className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Reconciliation Status</div>
              {data.pdfStatedTotal && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  PDF stated: {formatCurrency(data.pdfStatedTotal)}
                </div>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${reconciliationColor}`}>
            {data.reconciliationStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DisbursementSummary;
