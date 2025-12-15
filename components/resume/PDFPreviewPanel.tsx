'use client';

import { PDFViewer } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import { type ResumeContent } from '@/lib/ai-resume';
import { type WorkExperience, type Project, type UserAddress, type Education } from '@/lib/schemas';

export interface PDFPreviewPanelProps {
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
}

export function PDFPreviewPanel({
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
        phone={phone}
        address={address}
        resumeContent={resumeContent}
        experience={experience}
        projects={projects}
        education={education}
        targetJob={targetJob}
        hasWatermark={hasWatermark}
        showFooter={showFooter}
      />
    </PDFViewer>
  );
}
