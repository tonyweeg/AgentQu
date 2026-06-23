/**
 * Disbursement Summary Visualization
 * Carried - Motions carry, memory too
 *
 * Renders disbursement summary reports with visual breakdowns
 */

import { useMemo } from 'react';
import {
  DollarSign,
  Building2,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Receipt,
  Zap,
} from 'lucide-react';

interface DisbursementData {
  meetingDate?: string;
  apVendorPayments?: number;
  vendorLineCount?: number;
  utilityRefunds?: number;
  combinedTotal?: number;
  pdfStatedTotal?: number;
  reconciliationStatus?: 'OK' | 'MISMATCH' | 'UNKNOWN';
}

interface DisbursementSummaryProps {
  content: string;
  className?: string;
}

// Parse disbursement summary from text
function parseDisbursementSummary(content: string): DisbursementData | null {
  // Check if this looks like a disbursement summary
  if (!content.includes('Disbursement') && !content.includes('disbursed')) {
    return null;
  }

  const data: DisbursementData = {};

  // Extract meeting date
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

export function DisbursementSummary({ content, className = '' }: DisbursementSummaryProps) {
  const data = useMemo(() => parseDisbursementSummary(content), [content]);

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

      {/* Breakdown visualization */}
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
