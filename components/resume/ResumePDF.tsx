'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { type ResumeContent, type ResumeSkillGroup } from '@/lib/ai-resume';
import { type WorkExperience } from '@/lib/schemas';
import { RESUME_CONFIG } from '@/lib/constants';

// PDF styles using Helvetica (built-in font that works reliably)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
    paddingBottom: 15,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 5,
  },
  contact: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
  },
  skillCategory: {
    marginBottom: 10,
  },
  skillCategoryTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  skillHighRelevance: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  skillMediumRelevance: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  skillText: {
    fontSize: 9,
    color: '#334155',
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  experienceTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  experienceDate: {
    fontSize: 9,
    color: '#64748b',
  },
  experienceCompany: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 3,
  },
  experienceDescription: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.4,
  },
  highlightsTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  highlight: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 10,
    color: '#f59e0b',
    marginRight: 6,
    width: 10,
  },
  highlightText: {
    fontSize: 9,
    color: '#334155',
    flex: 1,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkMainText: {
    fontSize: 48,
    color: '#e5e7eb',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 4,
  },
  watermarkSubText: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 8,
    fontFamily: 'Helvetica',
  },
});

export interface ResumePDFProps {
  userName: string;
  email: string;
  resumeContent: ResumeContent;
  experience: WorkExperience[];
  targetJob?: string;
  hasWatermark?: boolean;
  showFooter?: boolean;
}

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return RESUME_CONFIG.pdfLabels.present;
  const [year, month] = dateStr.split('-');
  return `${RESUME_CONFIG.monthAbbreviations[parseInt(month, 10) - 1]} ${year}`;
}

export function ResumePDF({
  userName,
  email,
  resumeContent,
  experience,
  targetJob,
  hasWatermark = false,
  showFooter = true,
}: ResumePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for free tier users - fixed to appear on every page */}
        {hasWatermark && (
          <View style={styles.watermarkContainer} fixed>
            <Text style={styles.watermarkMainText}>{RESUME_CONFIG.pdfLabels.watermarkMain}</Text>
            <Text style={styles.watermarkSubText}>{RESUME_CONFIG.pdfLabels.watermarkSub}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{userName}</Text>
          {email && <Text style={styles.contact}>{email}</Text>}
          {targetJob && <Text style={styles.contact}>{RESUME_CONFIG.pdfLabels.applyingFor} {targetJob}</Text>}
        </View>

        {/* Professional Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{RESUME_CONFIG.pdfLabels.professionalSummary}</Text>
          <Text style={styles.summary}>{resumeContent.professionalSummary}</Text>
        </View>

        {/* Key Highlights */}
        {resumeContent.highlights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{RESUME_CONFIG.pdfLabels.keyHighlights}</Text>
            {resumeContent.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlight}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{RESUME_CONFIG.pdfLabels.skills}</Text>
          {resumeContent.skills.map((category: ResumeSkillGroup, catIndex: number) => (
            <View key={catIndex} style={styles.skillCategory}>
              <Text style={styles.skillCategoryTitle}>{category.category}</Text>
              <View style={styles.skillsRow}>
                {category.skills.map((skill, skillIndex) => (
                  <View
                    key={skillIndex}
                    style={[
                      styles.skill,
                      ...(skill.relevance === 'high' ? [styles.skillHighRelevance] : []),
                      ...(skill.relevance === 'medium' ? [styles.skillMediumRelevance] : []),
                    ]}
                  >
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Work Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{RESUME_CONFIG.pdfLabels.workExperience}</Text>
            {experience.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>{exp.title}</Text>
                  <Text style={styles.experienceDate}>
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </Text>
                </View>
                <Text style={styles.experienceCompany}>
                  {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                </Text>
                {exp.description && (
                  <Text style={styles.experienceDescription}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        {showFooter && (
          <Text style={styles.footer}>
            {RESUME_CONFIG.pdfLabels.footer} • {new Date().toLocaleDateString()}
          </Text>
        )}
      </Page>
    </Document>
  );
}
