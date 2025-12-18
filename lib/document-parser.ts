import * as cheerio from 'cheerio';
import { extract } from '@extractus/article-extractor';
import mammoth from 'mammoth';
import {
  DOCUMENT_IMPORT_CONFIG,
  IMAGE_EXTENSIONS,
  EXTENSION_TO_MIME,
} from './constants';

// Dynamic import for pdf-parse to avoid loading pdfjs-dist (which requires canvas)
// in serverless environments where it's not needed
async function getPDFParse() {
  const { PDFParse } = await import('pdf-parse');
  return PDFParse;
}

export interface ParsedDocument {
  content: string;
  metadata: {
    type: 'pdf' | 'text' | 'url' | 'docx' | 'image';
    title?: string;
    sourceUrl?: string;
    wordCount: number;
  };
  imageData?: {
    base64: string;
    mimeType: string;
  };
}

export interface DocumentParseError {
  code: 'INVALID_PDF' | 'INVALID_DOCX' | 'INVALID_IMAGE' | 'EMPTY_CONTENT' | 'FETCH_FAILED' | 'PARSE_FAILED' | 'TIMEOUT';
  message: string;
}

const {
  minContentLength,
  minTextContentLength,
  urlTimeout,
  fileTypes,
  charsPerToken,
  userAgent,
  portfolioDomains,
} = DOCUMENT_IMPORT_CONFIG;

/**
 * Parse PDF file from Buffer
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const PDFParse = await getPDFParse();
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    await parser.destroy();

    const content = cleanText(textResult.text);

    if (!content || content.length < minContentLength) {
      throw new Error('PDF appears to be empty or contains only images');
    }

    return {
      content,
      metadata: {
        type: 'pdf',
        title: infoResult.info?.Title || undefined,
        wordCount: countWords(content),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse PDF';
    throw { code: 'INVALID_PDF', message } as DocumentParseError;
  }
}

/**
 * Parse Word document (.doc, .docx) from Buffer
 */
export async function parseWord(buffer: Buffer, filename?: string): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const content = cleanText(result.value);

    if (!content || content.length < minContentLength) {
      throw new Error('Word document appears to be empty or contains only images');
    }

    const title = filename
      ? filename.replace(new RegExp(`\\.(${fileTypes.word.extensions.join('|')})$`, 'i'), '')
      : undefined;

    return {
      content,
      metadata: {
        type: 'docx',
        title,
        wordCount: countWords(content),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse Word document';
    throw { code: 'INVALID_DOCX', message } as DocumentParseError;
  }
}

/**
 * Parse image file - stores base64 for vision API processing
 */
export function parseImage(buffer: Buffer, mimeType: string, filename?: string): ParsedDocument {
  try {
    if (buffer.length > DOCUMENT_IMPORT_CONFIG.maxFileSizeBytes) {
      const maxMB = DOCUMENT_IMPORT_CONFIG.maxFileSizeBytes / (1024 * 1024);
      throw new Error(`Image file is too large (max ${maxMB}MB)`);
    }

    const base64 = buffer.toString('base64');
    const title = filename
      ? filename.replace(new RegExp(`\\.(${fileTypes.image.extensions.join('|')})$`, 'i'), '')
      : undefined;

    return {
      content: '[Image content - will be processed by vision API]',
      metadata: {
        type: 'image',
        title,
        wordCount: 0,
      },
      imageData: {
        base64,
        mimeType,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse image';
    throw { code: 'INVALID_IMAGE', message } as DocumentParseError;
  }
}

/**
 * Parse plain text or markdown content
 */
export function parseText(content: string, filename?: string): ParsedDocument {
  const cleanedContent = cleanText(content);

  if (!cleanedContent || cleanedContent.length < minTextContentLength) {
    throw { code: 'EMPTY_CONTENT', message: 'Document is empty or too short' } as DocumentParseError;
  }

  let title: string | undefined;
  const titleMatch = cleanedContent.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  } else if (filename) {
    title = filename.replace(new RegExp(`\\.(${fileTypes.text.extensions.join('|')})$`, 'i'), '');
  }

  return {
    content: cleanedContent,
    metadata: {
      type: 'text',
      title,
      wordCount: countWords(cleanedContent),
    },
  };
}

/**
 * Parse content from URL
 */
export async function parseURL(url: string): Promise<ParsedDocument> {
  detectURLType(url);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), urlTimeout);

    const article = await extract(url, {}, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (article && article.content) {
      const $ = cheerio.load(article.content);
      const textContent = $.text();
      const cleanedContent = cleanText(textContent);

      if (cleanedContent.length < minContentLength) {
        return await fetchAndParseRaw(url);
      }

      return {
        content: cleanedContent,
        metadata: {
          type: 'url',
          title: article.title || undefined,
          sourceUrl: url,
          wordCount: countWords(cleanedContent),
        },
      };
    }

    return await fetchAndParseRaw(url);
  } catch {
    return await fetchAndParseRaw(url);
  }
}

/**
 * Fallback: fetch URL and parse raw HTML
 */
async function fetchAndParseRaw(url: string): Promise<ParsedDocument> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), urlTimeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, header, footer, aside, [role="navigation"], [role="banner"]').remove();

    let content = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.main'];

    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text();
        break;
      }
    }

    if (!content) {
      content = $('body').text();
    }

    const cleanedContent = cleanText(content);

    if (!cleanedContent || cleanedContent.length < minContentLength) {
      throw new Error('Could not extract meaningful content from page');
    }

    const title = $('title').text() || $('h1').first().text() || undefined;

    return {
      content: cleanedContent,
      metadata: {
        type: 'url',
        title: cleanText(title || ''),
        sourceUrl: url,
        wordCount: countWords(cleanedContent),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw { code: 'TIMEOUT', message: 'Request timed out' } as DocumentParseError;
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch URL';
    throw { code: 'FETCH_FAILED', message } as DocumentParseError;
  }
}

/**
 * Detect the type of URL for specialized handling
 */
export function detectURLType(url: string): 'linkedin' | 'github' | 'portfolio' | 'generic' {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('linkedin.com/in/')) {
    return 'linkedin';
  }
  if (lowerUrl.includes('github.com/') && !lowerUrl.includes('github.com/search')) {
    return 'github';
  }

  if (portfolioDomains.some(domain => lowerUrl.includes(domain))) {
    return 'portfolio';
  }

  return 'generic';
}

/**
 * Clean and normalize text content
 */
function cleanText(text: string): string {
  return text
    .replace(/[\r\n]+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Truncate content to fit within token limits
 */
export function truncateForAI(content: string, maxTokens: number): string {
  const maxChars = maxTokens * charsPerToken;

  if (content.length <= maxChars) {
    return content;
  }

  const truncated = content.slice(0, maxChars);
  const lastParagraph = truncated.lastIndexOf('\n\n');

  if (lastParagraph > maxChars * 0.8) {
    return truncated.slice(0, lastParagraph).trim() + '\n\n[Content truncated...]';
  }

  const lastSentence = truncated.lastIndexOf('. ');
  if (lastSentence > maxChars * 0.8) {
    return truncated.slice(0, lastSentence + 1).trim() + '\n\n[Content truncated...]';
  }

  return truncated.trim() + '...\n\n[Content truncated...]';
}

/**
 * Check if file extension is supported
 */
export function isSupportedFileType(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const allExtensions: string[] = Object.values(fileTypes).flatMap(t => t.extensions as unknown as string[]);
  return allExtensions.includes(ext);
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop() || '';
  return (IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string | null {
  const ext = filename.toLowerCase().split('.').pop() || '';
  return EXTENSION_TO_MIME[ext] || null;
}
