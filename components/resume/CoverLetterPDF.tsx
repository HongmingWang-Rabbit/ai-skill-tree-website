'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { type CoverLetterContent } from '@/lib/ai-resume';
import { PDF_FONT_CONFIG, PDF_LABELS, PDF_STYLES } from '@/lib/constants';
import { type Locale } from '@/i18n/routing';
import { initializePDFFonts } from './pdfFonts';

// Get labels for a specific locale
function getLabels(locale: Locale) {
  return PDF_LABELS[locale] || PDF_LABELS.en;
}

// Get date locale string for formatting
function getDateLocale(locale: Locale): string {
  return PDF_FONT_CONFIG.dateLocales[locale] || PDF_FONT_CONFIG.dateLocales.en;
}

// Initialize fonts once
initializePDFFonts();

// PDF styles for cover letter (using shared PDF_STYLES constants)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: PDF_STYLES.colors.text.secondary,
    backgroundColor: PDF_STYLES.colors.background.white,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
  },
  senderInfo: {
    marginBottom: 20,
  },
  senderName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: PDF_STYLES.colors.text.primary,
    marginBottom: 4,
  },
  senderContact: {
    fontSize: 10,
    color: PDF_STYLES.colors.text.placeholder,
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: PDF_STYLES.colors.text.placeholder,
    marginTop: 15,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 11,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 12,
  },
  closing: {
    fontSize: 11,
    marginTop: 20,
    marginBottom: 5,
  },
  signature: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: PDF_STYLES.colors.text.disabled,
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    fontSize: 60,
    color: PDF_STYLES.colors.watermark.draft,
    opacity: 0.3,
    transform: 'rotate(-30deg)',
  },
});

// Get font family based on locale
function getFontFamily(locale: Locale): { regular: string; bold: string } {
  return PDF_FONT_CONFIG.families[locale] || PDF_FONT_CONFIG.families.en;
}

// Sanitize text by replacing newlines with spaces (prevents unwanted line breaks in paragraphs)
function sanitizeText(text: string): string {
  return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

export interface CoverLetterPDFProps {
  userName: string;
  email: string;
  phone?: string;
  coverLetterContent: CoverLetterContent;
  targetJob?: string | null;
  companyName?: string | null;
  hasWatermark?: boolean;
  showFooter?: boolean;
  locale?: Locale;
}

export function CoverLetterPDF({
  userName,
  email,
  phone,
  coverLetterContent,
  hasWatermark = false,
  showFooter = true,
  locale = 'en',
}: CoverLetterPDFProps) {
  const fonts = getFontFamily(locale);
  const labels = getLabels(locale);
  const currentDate = new Date().toLocaleDateString(
    getDateLocale(locale),
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, fontFamily: fonts.regular }}>
        {/* Watermark */}
        {hasWatermark && (
          <Text style={styles.watermark}>{labels.watermarkDraft}</Text>
        )}

        {/* Header - Sender Info */}
        <View style={styles.header}>
          <View style={styles.senderInfo}>
            <Text style={{ ...styles.senderName, fontFamily: fonts.bold }}>
              {userName}
            </Text>
            <Text style={styles.senderContact}>{email}</Text>
            {phone && <Text style={styles.senderContact}>{phone}</Text>}
          </View>
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>{sanitizeText(coverLetterContent.greeting)}</Text>

        {/* Opening Paragraph */}
        <Text style={styles.paragraph}>{sanitizeText(coverLetterContent.opening)}</Text>

        {/* Body Paragraphs */}
        {coverLetterContent.body.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {sanitizeText(paragraph)}
          </Text>
        ))}

        {/* Closing */}
        <Text style={styles.closing}>{sanitizeText(coverLetterContent.closing)}</Text>

        {/* Signature */}
        <Text style={{ ...styles.signature, fontFamily: fonts.bold }}>
          {coverLetterContent.signature.replace('\\n', '\n')}
        </Text>

        {/* Footer */}
        {showFooter && (
          <Text style={styles.footer}>
            {labels.footer} | {labels.footerUrl}
          </Text>
        )}
      </Page>
    </Document>
  );
}
