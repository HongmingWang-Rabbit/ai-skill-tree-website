'use client';

import { Font } from '@react-pdf/renderer';
import { PDF_FONT_CONFIG } from '@/lib/constants';

// Track if fonts have been initialized to prevent duplicate registration
let fontsInitialized = false;

export function initializePDFFonts() {
  if (fontsInitialized) return;
  fontsInitialized = true;

  // Register CJK fonts for Chinese and Japanese support
  Font.register({
    family: PDF_FONT_CONFIG.fontFamilies.notoSansSC,
    fonts: [
      { src: PDF_FONT_CONFIG.notoSansSC.regular, fontWeight: 400 },
      { src: PDF_FONT_CONFIG.notoSansSC.bold, fontWeight: 700 },
    ],
  });

  Font.register({
    family: PDF_FONT_CONFIG.fontFamilies.notoSansJP,
    fonts: [
      { src: PDF_FONT_CONFIG.notoSansJP.regular, fontWeight: 400 },
      { src: PDF_FONT_CONFIG.notoSansJP.bold, fontWeight: 700 },
    ],
  });

  // Register hyphenation callback for CJK text wrapping
  // Smart splitting: only split CJK characters, keep English/numbers together
  Font.registerHyphenationCallback((word: string) => {
    // If no CJK characters, return word as-is (no breaking)
    if (!PDF_FONT_CONFIG.cjkPattern.test(word)) {
      return [word];
    }

    // Split into segments: CJK chars individually, non-CJK runs together
    const segments: string[] = [];
    let nonCJKBuffer = '';

    for (const char of word) {
      if (PDF_FONT_CONFIG.cjkPattern.test(char)) {
        // CJK character found
        // First, push any accumulated non-CJK characters as one segment
        if (nonCJKBuffer) {
          segments.push(nonCJKBuffer);
          nonCJKBuffer = '';
        }
        // Push CJK char as individual segment (allows line break after it)
        segments.push(char);
      } else {
        // Non-CJK character - accumulate into buffer
        nonCJKBuffer += char;
      }
    }

    // Push any remaining non-CJK characters
    if (nonCJKBuffer) {
      segments.push(nonCJKBuffer);
    }

    return segments.length > 0 ? segments : [word];
  });
}
