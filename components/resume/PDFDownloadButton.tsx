'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import { type ResumeContent } from '@/lib/ai-resume';
import { type WorkExperience } from '@/lib/schemas';
import { DownloadIcon } from '@/components/ui';

export interface PDFDownloadButtonProps {
  userName: string;
  email: string;
  bio?: string;
  resumeContent: ResumeContent;
  experience: WorkExperience[];
  targetJob?: string;
  fileName: string;
  buttonText: string;
}

export function PDFDownloadButton({
  userName,
  email,
  bio,
  resumeContent,
  experience,
  targetJob,
  fileName,
  buttonText,
}: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={
        <ResumePDF
          userName={userName}
          email={email}
          bio={bio}
          resumeContent={resumeContent}
          experience={experience}
          targetJob={targetJob}
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
