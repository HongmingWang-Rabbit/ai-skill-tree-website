'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import { type ResumeContent } from '@/lib/ai-resume';
import { type WorkExperience, type Project, type UserAddress, type Education } from '@/lib/schemas';
import { DownloadIcon } from '@/components/ui';
import { type Locale } from '@/i18n/routing';

export interface PDFDownloadButtonProps {
  userName: string;
  email: string;
  phone?: string;
  address?: UserAddress;
  resumeContent: ResumeContent;
  experience: WorkExperience[];
  projects?: Project[];
  education?: Education[];
  targetJob?: string;
  hasWatermark?: boolean;
  showFooter?: boolean;
  fileName: string;
  buttonText: string;
  locale?: Locale;
}

export function PDFDownloadButton({
  userName,
  email,
  phone,
  address,
  resumeContent,
  experience,
  projects,
  education,
  targetJob,
  hasWatermark = false,
  showFooter = true,
  fileName,
  buttonText,
  locale = 'en',
}: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={
        <ResumePDF
          userName={userName}
          email={email}
          phone={phone}
          address={address}
          resumeContent={resumeContent}
          experience={experience}
          projects={projects}
          education={education}
          targetJob={targetJob}
          hasWatermark={hasWatermark}
          showFooter={showFooter}
          locale={locale}
        />
      }
      fileName={fileName}
      className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors flex items-center gap-2"
    >
      {({ loading }) => (
        <>
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <DownloadIcon className="w-4 h-4" />
          )}
          {buttonText}
        </>
      )}
    </PDFDownloadLink>
  );
}
