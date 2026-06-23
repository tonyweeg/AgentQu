/**
 * File Parser Utility
 * Carried - Motions carry, memory too
 *
 * Parses DOCX and PDF files to extract text content
 * Uses Gemini Vision for voting tables in PDFs
 */

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractVotingTables, formatVotesAsText, VoteTableResult } from './voteTableExtractor';

// Initialize Gemini for OCR fallback
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

// Set up PDF.js worker using unpkg (always has exact npm version)
const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
console.log('CARRIED_DEBUG: PDF.js version:', pdfjsLib.version, 'worker URL:', workerUrl);
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export type SupportedFileType = 'docx' | 'pdf' | 'txt' | 'xlsx';

export interface ParseResult {
  text: string;
  pageCount?: number;
  pagesProcessed?: number;
  pagesSkipped?: number;
  voteTablesExtracted?: number;
  votingData?: VoteTableResult[];
  sheetCount?: number;
  sheetsProcessed?: string[];
  rowCount?: number;
  error?: string;
}

/**
 * Detect file type from file extension
 */
export function getFileType(file: File): SupportedFileType | null {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'docx':
      return 'docx';
    case 'pdf':
      return 'pdf';
    case 'txt':
      return 'txt';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    default:
      return null;
  }
}

/**
 * Parse a DOCX file and extract text
 */
async function parseDocx(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (result.messages.length > 0) {
      console.log('CARRIED_DEBUG: DOCX parsing messages:', result.messages);
    }

    return {
      text: result.value,
    };
  } catch (error) {
    console.error('CARRIED_DEBUG: DOCX parsing error:', error);
    return {
      text: '',
      error: `Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Render a PDF page to a base64 image for OCR
 */
async function renderPageToImage(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const scale = 1.5; // Good balance of quality vs size
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  } as any).promise;

  const base64 = canvas.toDataURL('image/jpeg', 0.8);
  canvas.remove();
  return base64.split(',')[1];
}

/**
 * Use Gemini Vision to OCR a PDF page when PDF.js fails
 */
async function ocrPageWithGemini(imageBase64: string, pageNum: number): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Extract ALL text from this document image. This is a meeting minutes or agenda page.

IMPORTANT:
- Extract every word exactly as written
- Preserve paragraph structure
- Include headers, dates, names, and all content
- Do NOT summarize - extract the complete text
- Do NOT add any commentary or explanation

Return ONLY the extracted text, nothing else.`;

  try {
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text();
    console.log(`CARRIED_DEBUG: OCR page ${pageNum}: extracted ${text.length} chars`);
    return text;
  } catch (error) {
    console.error(`CARRIED_DEBUG: OCR failed for page ${pageNum}:`, error);
    return '';
  }
}

/**
 * Check if a page looks like an architectural drawing or diagram
 * These have very little readable text and lots of measurements/technical terms
 */
function isDrawingPage(pageText: string): boolean {
  // Drawing pages typically have very little text
  const wordCount = pageText.split(/\s+/).filter(w => w.length > 2).length;

  console.log(`CARRIED_DEBUG: Page has ${wordCount} words`);

  // If page has fewer than 20 real words, likely a drawing (lowered from 50)
  if (wordCount < 20) {
    return true;
  }

  // Check for architectural drawing keywords (high density = drawing)
  const drawingKeywords = [
    'ELEVATION', 'FLOOR PLAN', 'FOUNDATION PLAN', 'SCALE:', '1/4"=',
    'FRAMING', 'TRUSS', 'STUD', 'JOIST', 'SHEATHING', 'SIDING',
    'CONTRACTOR', 'REVISION BLOCK', 'KEY PLAN', 'SITE PLAN',
    'WALKWAY', 'EGRESS', 'NON-RATED WALL', 'FIRE RATED',
    'A.100', 'A.101', 'A.102', 'A.103', 'A.104' // Sheet numbers
  ];

  const upperText = pageText.toUpperCase();
  const keywordMatches = drawingKeywords.filter(kw => upperText.includes(kw)).length;

  // If 3+ drawing keywords found, it's likely a drawing page
  if (keywordMatches >= 3) {
    return true;
  }

  // Check ratio of numbers/measurements to words (drawings have lots of measurements)
  const measurementPattern = /\d+['-]\d*|\d+\/\d+|\d+\.\d+|0\.C\.|TYP\./gi;
  const measurements = (pageText.match(measurementPattern) || []).length;

  // High measurement-to-word ratio indicates drawing
  if (measurements > 20 && measurements / wordCount > 0.3) {
    return true;
  }

  return false;
}

/**
 * Parse a PDF file and extract text
 * Uses Gemini Vision for voting tables to preserve column structure
 * Skips architectural drawings and diagram pages
 */
async function parsePdf(file: File): Promise<ParseResult> {
  console.log('CARRIED_DEBUG: parsePdf called for', file.name, file.size, 'bytes');
  try {
    console.log('CARRIED_DEBUG: Reading file as ArrayBuffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('CARRIED_DEBUG: ArrayBuffer ready, size:', arrayBuffer.byteLength);

    // Make a copy for vision extraction (ArrayBuffer can only be used once)
    const arrayBufferCopy = arrayBuffer.slice(0);

    console.log('CARRIED_DEBUG: Loading PDF with pdf.js...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('CARRIED_DEBUG: PDF loaded, pages:', pdf.numPages);

    const textParts: string[] = [];
    let skippedPages = 0;

    // First, extract all text normally, but skip drawing pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract text items and join them
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      // Skip pages that look like architectural drawings
      if (isDrawingPage(pageText)) {
        console.log(`CARRIED_DEBUG: Skipping page ${pageNum} (detected as drawing/diagram)`);
        skippedPages++;
        continue;
      }

      console.log(`CARRIED_DEBUG: Including page ${pageNum} (${pageText.length} chars)`);
      textParts.push(pageText);
    }

    console.log(`CARRIED_DEBUG: Processed ${pdf.numPages - skippedPages} of ${pdf.numPages} pages (skipped ${skippedPages} drawing pages)`);
    console.log(`CARRIED_DEBUG: Total extracted text length: ${textParts.join('').length} chars`);

    let fullText = textParts.join('\n\n');
    let votingData: VoteTableResult[] = [];

    // OCR FALLBACK: If PDF.js extracted no text, use Gemini Vision OCR
    if (fullText.trim().length === 0) {
      console.log('CARRIED_DEBUG: PDF.js extracted 0 text, falling back to Gemini Vision OCR...');

      const ocrTexts: string[] = [];
      // Only OCR first 10 pages max (to avoid excessive API calls)
      const maxOcrPages = Math.min(pdf.numPages, 10);

      for (let pageNum = 1; pageNum <= maxOcrPages; pageNum++) {
        console.log(`CARRIED_DEBUG: OCR rendering page ${pageNum}/${maxOcrPages}...`);
        const imageBase64 = await renderPageToImage(pdf, pageNum);
        const pageText = await ocrPageWithGemini(imageBase64, pageNum);

        if (pageText.trim().length > 0) {
          ocrTexts.push(`--- Page ${pageNum} ---\n${pageText}`);
        }

        // Small delay to avoid rate limiting
        if (pageNum < maxOcrPages) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      fullText = ocrTexts.join('\n\n');
      console.log(`CARRIED_DEBUG: OCR complete, extracted ${fullText.length} chars from ${ocrTexts.length} pages`);
    }

    // Check if there are voting tables that need vision processing
    if (fullText.includes('Counted toward') && fullText.includes('Quorum')) {
      console.log('CARRIED_DEBUG: Detected voting tables, using Gemini Vision for accurate extraction...');

      try {
        // Extract voting tables using vision (use the copy since original buffer is consumed)
        votingData = await extractVotingTables(arrayBufferCopy);

        if (votingData.length > 0) {
          // PREPEND formatted vote data to the text so AI sees it FIRST
          const voteText = formatVotesAsText(votingData);
          fullText = voteText + fullText;
          console.log(`CARRIED_DEBUG: Prepended ${votingData.length} voting records to text`);
        }
      } catch (visionError) {
        console.error('CARRIED_DEBUG: Vision extraction failed, using text-only:', visionError);
        // Continue with text-only extraction if vision fails
      }
    }

    return {
      text: fullText,
      pageCount: pdf.numPages,
      pagesProcessed: pdf.numPages - skippedPages,
      pagesSkipped: skippedPages,
      voteTablesExtracted: votingData.length,
      votingData,
    };
  } catch (error) {
    console.error('CARRIED_DEBUG: PDF parsing error:', error);
    return {
      text: '',
      error: `Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse a TXT file
 */
async function parseTxt(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    return { text };
  } catch (error) {
    console.error('CARRIED_DEBUG: TXT parsing error:', error);
    return {
      text: '',
      error: `Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse an Excel file (XLSX/XLS) and extract text
 * Converts spreadsheet data to readable text format
 */
async function parseXlsx(file: File): Promise<ParseResult> {
  console.log('CARRIED_DEBUG: parseXlsx called for', file.name, file.size, 'bytes');
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    console.log('CARRIED_DEBUG: Excel workbook loaded, sheets:', workbook.SheetNames);

    const textParts: string[] = [];
    let totalRows = 0;

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      // Get sheet range
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      const rowCount = range.e.r - range.s.r + 1;
      totalRows += rowCount;

      console.log(`CARRIED_DEBUG: Processing sheet "${sheetName}" with ${rowCount} rows`);

      // Convert sheet to array of arrays for better control
      const data: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        blankrows: false,
      });

      if (data.length === 0) {
        console.log(`CARRIED_DEBUG: Sheet "${sheetName}" is empty, skipping`);
        continue;
      }

      // Add sheet header
      textParts.push(`\n=== Sheet: ${sheetName} ===\n`);

      // First row is likely headers
      const headers = data[0] as string[];

      // Format data as readable text
      // For structured data like check runs, create a clear format
      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        // Skip completely empty rows
        if (row.every(cell => cell === '' || cell === null || cell === undefined)) {
          continue;
        }

        // If first row (headers), format as header line
        if (i === 0) {
          const headerLine = row.filter(h => h !== '').join(' | ');
          textParts.push(`HEADERS: ${headerLine}`);
          textParts.push('---');
          continue;
        }

        // For data rows, create key-value pairs using headers
        const rowParts: string[] = [];
        for (let j = 0; j < row.length; j++) {
          const cellValue = row[j];
          if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
            const header = headers[j] || `Column${j + 1}`;
            // Format dates if detected (Excel stores dates as numbers)
            let displayValue = cellValue;
            if (typeof cellValue === 'number' && cellValue > 40000 && cellValue < 50000) {
              // Likely an Excel date serial number
              try {
                const date = XLSX.SSF.parse_date_code(cellValue);
                displayValue = `${date.m}/${date.d}/${date.y}`;
              } catch {
                displayValue = cellValue;
              }
            }
            rowParts.push(`${header}: ${displayValue}`);
          }
        }

        if (rowParts.length > 0) {
          textParts.push(rowParts.join(' | '));
        }
      }
    }

    const fullText = textParts.join('\n');
    console.log(`CARRIED_DEBUG: Excel parsing complete, ${totalRows} total rows, ${fullText.length} chars extracted`);

    return {
      text: fullText,
      sheetCount: workbook.SheetNames.length,
      sheetsProcessed: workbook.SheetNames,
      rowCount: totalRows,
    };
  } catch (error) {
    console.error('CARRIED_DEBUG: Excel parsing error:', error);
    return {
      text: '',
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse a file and extract text content
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const fileType = getFileType(file);

  if (!fileType) {
    return {
      text: '',
      error: `Unsupported file type. Please upload a DOCX, PDF, TXT, or XLSX file.`,
    };
  }

  console.log(`CARRIED_DEBUG: Parsing ${fileType.toUpperCase()} file: ${file.name}`);

  switch (fileType) {
    case 'docx':
      return parseDocx(file);
    case 'pdf':
      return parsePdf(file);
    case 'txt':
      return parseTxt(file);
    case 'xlsx':
      return parseXlsx(file);
    default:
      return {
        text: '',
        error: 'Unknown file type',
      };
  }
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File is too large. Maximum size is 30MB.',
    };
  }

  const fileType = getFileType(file);
  if (!fileType) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a DOCX, PDF, TXT, or XLSX file.',
    };
  }

  return { valid: true };
}
