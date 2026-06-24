/**
 * PDF Check Run Summary Visualization
 * Carried - Motions carry, memory too
 *
 * Parses raw PDF check run reports and displays vendor payments
 * Handles the Town of Berlin Payment Register PDF format
 */

import { useMemo, useState } from 'react';
import {
  DollarSign,
  Building2,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Hash,
} from 'lucide-react';

interface VendorPayment {
  vendor: string;
  amount: number;
  date?: string;
  checkNumber?: string;
  description?: string;
}

interface PDFCheckRunData {
  reportDate?: string;
  reportDates?: string[];  // Multiple dates in header
  bankName?: string;
  totalAmount: number;
  vendorPayments: VendorPayment[];
  pageCount?: number;
}

interface PDFCheckRunSummaryProps {
  content: string;
  rawMinutes?: string;
  className?: string;
}

// Parse PDF check run data
function parsePDFCheckRun(content: string, rawMinutes?: string): PDFCheckRunData | null {
  // Check if this looks like a PDF check run
  const lowerContent = content.toLowerCase();
  const hasCheckRunKeywords =
    lowerContent.includes('check run') ||
    lowerContent.includes('payment register') ||
    (lowerContent.includes('vendor') && lowerContent.includes('paid'));

  if (!hasCheckRunKeywords) {
    return null;
  }

  // Also check rawMinutes format - must NOT be Excel format
  if (rawMinutes?.includes('=== Sheet:')) {
    return null; // This is Excel format, let other component handle it
  }

  const data: PDFCheckRunData = {
    totalAmount: 0,
    vendorPayments: [],
  };

  // Extract date from content
  const dateMatch = content.match(/(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/);
  if (dateMatch) {
    data.reportDate = dateMatch[1];
  }

  // Extract multiple dates from header (e.g., "Check Run Report 10.10.25 10.15.25 10.16.25")
  if (rawMinutes) {
    const headerDates = rawMinutes.match(/Check Run Report\s+([\d\.\s]+)/i);
    if (headerDates) {
      data.reportDates = headerDates[1].trim().split(/\s+/).filter(d => d.match(/\d+\.\d+\.\d+/));
    }

    // Extract bank name
    const bankMatch = rawMinutes.match(/Bank:\s*([A-Z\s]+)-/i);
    if (bankMatch) {
      data.bankName = bankMatch[1].trim();
    }

    // Extract page count
    const pageMatch = rawMinutes.match(/Page \d+ of (\d+)/i);
    if (pageMatch) {
      data.pageCount = parseInt(pageMatch[1]);
    }

    // Parse vendor payments from raw PDF text
    // Pattern: "Vendor Number VENDOR_NAME Total Vendor Amount XXX.XX"
    // Or: After vendor name, look for amounts

    // Try pattern 1: "Total Vendor Amount XXX.XX" preceded by vendor name
    const vendorPattern1 = /Vendor (?:Number|Name)\s+([A-Z][A-Z\s\.\,\&\-\']+?)\s+Total Vendor Amount\s+([\d,]+\.?\d*)/gi;
    let match;
    while ((match = vendorPattern1.exec(rawMinutes)) !== null) {
      const vendor = match[1].trim().replace(/\s+/g, ' ');
      const amount = parseFloat(match[2].replace(/,/g, ''));
      if (vendor && amount > 0 && vendor.length > 2) {
        // Check for payment date nearby
        const nearbyText = rawMinutes.substring(match.index, match.index + 200);
        const dateNearby = nearbyText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);

        data.vendorPayments.push({
          vendor: vendor,
          amount: amount,
          date: dateNearby ? dateNearby[1] : undefined,
          checkNumber: undefined,
        });
      }
    }

    // Try pattern 2: Look for "VENDOR_NAME ... Check DATE AMOUNT"
    if (data.vendorPayments.length === 0) {
      const vendorPattern2 = /([A-Z][A-Z\s\.\,\&\-\']{3,40})\s+Check\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+([\d,]+\.?\d*)/gi;
      while ((match = vendorPattern2.exec(rawMinutes)) !== null) {
        const vendor = match[1].trim().replace(/\s+/g, ' ');
        const date = match[2];
        const amount = parseFloat(match[3].replace(/,/g, ''));
        if (vendor && amount > 0) {
          data.vendorPayments.push({
            vendor: vendor,
            amount: amount,
            date: date,
          });
        }
      }
    }

    // Also try to extract from content if AI summarized it
    // Pattern: "Vendor VENDOR_NAME was paid $XXX.XX"
    const contentPattern = /Vendor\s+([A-Z][A-Z\s\.\,\&\-\']+)\s+was paid\s+\$([\d,]+\.?\d*)/gi;
    while ((match = contentPattern.exec(content)) !== null) {
      const vendor = match[1].trim();
      const amount = parseFloat(match[2].replace(/,/g, ''));
      // Check if we already have this vendor
      const exists = data.vendorPayments.some(v => v.vendor === vendor && v.amount === amount);
      if (!exists && vendor && amount > 0) {
        data.vendorPayments.push({
          vendor: vendor,
          amount: amount,
        });
      }
    }
  }

  // Also parse from content if it has structured info
  const contentAmountMatch = content.match(/Total Vendor Amount[:\s]*([\d,]+\.?\d*)/i);
  if (contentAmountMatch) {
    data.totalAmount = parseFloat(contentAmountMatch[1].replace(/,/g, ''));
  }

  // Calculate total from vendor payments if not found
  if (data.totalAmount === 0 && data.vendorPayments.length > 0) {
    data.totalAmount = data.vendorPayments.reduce((sum, v) => sum + v.amount, 0);
  }

  // If we still have no vendor payments but have content with amounts, extract from content
  if (data.vendorPayments.length === 0) {
    const simplePattern = /([A-Z][A-Z\s]+)\s+(?:was paid|received)\s+\$([\d,]+\.?\d*)/gi;
    let match;
    while ((match = simplePattern.exec(content)) !== null) {
      data.vendorPayments.push({
        vendor: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, '')),
      });
    }
  }

  // Only return if we found meaningful data
  if (data.vendorPayments.length > 0 || data.totalAmount > 0) {
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

export function PDFCheckRunSummary({ content, rawMinutes, className = '' }: PDFCheckRunSummaryProps) {
  const [showAllVendors, setShowAllVendors] = useState(false);

  const data = useMemo(() => parsePDFCheckRun(content, rawMinutes), [content, rawMinutes]);

  if (!data) {
    return null;
  }

  const displayVendors = showAllVendors
    ? data.vendorPayments
    : data.vendorPayments.slice(0, 10);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold text-lg">Check Run Report</h3>
          </div>
          {data.reportDate && (
            <div className="flex items-center gap-1 text-slate-200 text-sm">
              <Calendar className="w-4 h-4" />
              {data.reportDate}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-slate-200 text-xs flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Total Amount
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.totalAmount)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-slate-200 text-xs flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Vendors
            </div>
            <div className="text-xl font-bold">{data.vendorPayments.length}</div>
          </div>
          {data.bankName && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-slate-200 text-xs flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Bank
              </div>
              <div className="text-sm font-bold">{data.bankName}</div>
            </div>
          )}
          {data.pageCount && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-slate-200 text-xs flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Pages
              </div>
              <div className="text-xl font-bold">{data.pageCount}</div>
            </div>
          )}
        </div>

        {/* Multiple report dates */}
        {data.reportDates && data.reportDates.length > 1 && (
          <div className="mt-3 text-xs text-slate-300">
            <span className="font-medium">Report dates:</span>{' '}
            {data.reportDates.join(', ')}
          </div>
        )}
      </div>

      {/* Vendor Payments Table */}
      {data.vendorPayments.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Vendor Payments</h4>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {data.vendorPayments.length} payments
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Vendor</th>
                  <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                  {displayVendors.some(v => v.date) && (
                    <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayVendors.map((payment, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-slate-700/50 transition-colors hover:bg-black/5 dark:hover:bg-white/10">
                    <td className="py-2 px-2 text-gray-900 dark:text-gray-100 font-medium">{payment.vendor}</td>
                    <td className="py-2 px-2 text-right font-mono text-gray-900 dark:text-gray-100">
                      {formatCurrency(payment.amount)}
                    </td>
                    {displayVendors.some(v => v.date) && (
                      <td className="py-2 px-2 text-gray-600 dark:text-gray-400 text-xs">
                        {payment.date || '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-slate-600">
                  <td className="py-2 px-2 font-bold text-gray-900 dark:text-gray-100">Total</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.totalAmount)}
                  </td>
                  {displayVendors.some(v => v.date) && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>

          {data.vendorPayments.length > 10 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAllVendors(!showAllVendors); }}
              className="mt-4 flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
            >
              {showAllVendors ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show all {data.vendorPayments.length} payments
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PDFCheckRunSummary;
