/**
 * File Parser Utility
 * Carried - Motions carry, memory too
 *
 * Parses DOCX and PDF files to extract text content
 * Uses Gemini Vision for voting tables in PDFs
 */

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { extractVotingTables, formatVotesAsText, VoteTableResult } from './voteTableExtractor';

// Set up PDF.js worker using unpkg CDN which has the latest versions
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export type SupportedFileType = 'docx' | 'pdf' | 'txt';

export interface ParseResult {
  text: string;
  pageCount?: number;
  voteTablesExtracted?: number;
  votingData?: VoteTableResult[];
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
 * Parse a PDF file and extract text
 * Uses Gemini Vision for voting tables to preserve column structure
 */
async function parsePdf(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Make a copy for vision extraction (ArrayBuffer can only be used once)
    const arrayBufferCopy = arrayBuffer.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textParts: string[] = [];

    // First, extract all text normally
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract text items and join them
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      textParts.push(pageText);
    }

    let fullText = textParts.join('\n\n');
    let votingData: VoteTableResult[] = [];

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
 * Parse a file and extract text content
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const fileType = getFileType(file);

  if (!fileType) {
    return {
      text: '',
      error: `Unsupported file type. Please upload a DOCX, PDF, or TXT file.`,
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
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File is too large. Maximum size is 10MB.',
    };
  }

  const fileType = getFileType(file);
  if (!fileType) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a DOCX, PDF, or TXT file.',
    };
  }

  return { valid: true };
}
