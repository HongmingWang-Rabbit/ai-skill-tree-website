'use client';

import { PDFViewer } from '@react-pdf/renderer';
import { CoverLetterPDF } from './CoverLetterPDF';
import { type CoverLetterContent } from '@/lib/ai-resume';
import { type Locale } from '@/i18n/routing';
import { PDF_STYLES } from '@/lib/constants';

export interface CoverLetterPreviewPanelProps {
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

export function CoverLetterPreviewPanel({
  userName,
  email,
  phone,
  coverLetterContent,
  targetJob,
  companyName,
  hasWatermark = false,
  showFooter = true,
  locale = 'en',
}: CoverLetterPreviewPanelProps) {
  return (
    <PDFViewer
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: `${PDF_STYLES.borderRadius.lg}px`,
      }}
      showToolbar={false}
    >
      <CoverLetterPDF
        userName={userName}
        email={email}
        phone={phone}
        coverLetterContent={coverLetterContent}
        targetJob={targetJob}
        companyName={companyName}
        hasWatermark={hasWatermark}
        showFooter={showFooter}
        locale={locale}
      />
    </PDFViewer>
  );
}
