'use client';

import { PDFViewer } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import { type ResumeContent } from '@/lib/ai-resume';
import { type WorkExperience } from '@/lib/schemas';

export interface PDFPreviewPanelProps {
  userName: string;
  email: string;
  resumeContent: ResumeContent;
  experience: WorkExperience[];
  targetJob?: string;
  hasWatermark?: boolean;
  showFooter?: boolean;
}

export function PDFPreviewPanel({
  userName,
  email,
  resumeContent,
  experience,
  targetJob,
  hasWatermark = false,
  showFooter = true,
}: PDFPreviewPanelProps) {
  return (
    <PDFViewer
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '8px',
      }}
      showToolbar={false}
    >
      <ResumePDF
        userName={userName}
        email={email}
        resumeContent={resumeContent}
        experience={experience}
        targetJob={targetJob}
        hasWatermark={hasWatermark}
        showFooter={showFooter}
      />
    </PDFViewer>
  );
}
