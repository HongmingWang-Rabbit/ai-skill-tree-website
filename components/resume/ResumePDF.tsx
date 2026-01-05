'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from '@react-pdf/renderer';
import { type ResumeContent, type ResumeSkillGroup } from '@/lib/ai-resume';
import { type WorkExperience, type Project, type UserAddress, type Education } from '@/lib/schemas';
import { RESUME_CONFIG, PDF_LABELS, PDF_FONT_CONFIG, PDF_STYLES } from '@/lib/constants';
import { type Locale } from '@/i18n/routing';
import { initializePDFFonts } from './pdfFonts';

// Initialize fonts once
initializePDFFonts();

// PDF styles using shared PDF_STYLES constants
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: PDF_STYLES.colors.text.secondary,
    backgroundColor: PDF_STYLES.colors.background.white,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: PDF_STYLES.colors.accent.amber,
    paddingBottom: 15,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: PDF_STYLES.colors.text.primary,
    marginBottom: 5,
  },
  contact: {
    fontSize: 10,
    color: PDF_STYLES.colors.text.placeholder,
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: PDF_STYLES.colors.text.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: PDF_STYLES.colors.background.subtle,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: PDF_STYLES.colors.text.muted,
  },
  skillCategory: {
    marginBottom: 10,
  },
  skillCategoryTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PDF_STYLES.colors.text.secondary,
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
    backgroundColor: PDF_STYLES.colors.background.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: PDF_STYLES.borderRadius.md,
    marginRight: 5,
    marginBottom: 5,
  },
  skillHighRelevance: {
    backgroundColor: PDF_STYLES.colors.accent.amberLight,
    borderWidth: 1,
    borderColor: PDF_STYLES.colors.accent.amber,
  },
  skillMediumRelevance: {
    backgroundColor: PDF_STYLES.colors.accent.cyanLight,
    borderWidth: 1,
    borderColor: PDF_STYLES.colors.accent.cyan,
  },
  skillText: {
    fontSize: 9,
    color: PDF_STYLES.colors.text.muted,
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
    color: PDF_STYLES.colors.text.primary,
  },
  experienceDate: {
    fontSize: 9,
    color: PDF_STYLES.colors.text.placeholder,
  },
  experienceCompany: {
    fontSize: 10,
    color: PDF_STYLES.colors.text.subtle,
    marginBottom: 3,
  },
  experienceDescription: {
    fontSize: 9,
    color: PDF_STYLES.colors.text.muted,
    lineHeight: 1.4,
  },
  projectItem: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  projectName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PDF_STYLES.colors.text.primary,
    flex: 1,
  },
  projectDate: {
    fontSize: 9,
    color: PDF_STYLES.colors.text.placeholder,
  },
  projectUrl: {
    fontSize: 8,
    color: PDF_STYLES.colors.accent.cyan,
    marginBottom: 3,
  },
  projectDescription: {
    fontSize: 9,
    color: PDF_STYLES.colors.text.muted,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  projectTechnologies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  projectTech: {
    fontSize: 8,
    color: PDF_STYLES.colors.text.subtle,
    backgroundColor: PDF_STYLES.colors.background.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: PDF_STYLES.borderRadius.sm,
  },
  highlightsTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PDF_STYLES.colors.text.secondary,
    marginBottom: 5,
  },
  highlight: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 10,
    color: PDF_STYLES.colors.accent.amber,
    marginRight: 6,
    width: 10,
  },
  highlightText: {
    fontSize: 9,
    color: PDF_STYLES.colors.text.muted,
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
    color: PDF_STYLES.colors.text.disabled,
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
    color: PDF_STYLES.colors.watermark.main,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 4,
  },
  watermarkSubText: {
    fontSize: 14,
    color: PDF_STYLES.colors.watermark.sub,
    marginTop: 8,
    fontFamily: 'Helvetica',
  },
});

export interface ResumePDFProps {
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
  locale?: Locale;
}

// Check if a date string is valid (YYYY-MM format)
function isValidDateString(dateStr: string | null | undefined): boolean {
  if (!dateStr || dateStr === 'undefined' || dateStr === 'null') return false;
  const parts = dateStr.split('-');
  if (parts.length !== 2) return false;
  const [year, month] = parts;
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  return !isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
}

// Type for PDF labels (any locale)
type PDFLabels = (typeof PDF_LABELS)[keyof typeof PDF_LABELS];

// Format date for display (locale-aware)
function formatDate(dateStr: string | null | undefined, labels: PDFLabels): string {
  if (!isValidDateString(dateStr)) return labels.present;
  const [year, month] = dateStr!.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${labels.monthAbbreviations[monthIndex]} ${year}`;
}

// Format project date for display (with ongoing support, locale-aware)
function formatProjectDate(dateStr: string | null | undefined, labels: PDFLabels): string {
  // null explicitly means "ongoing"
  if (dateStr === null) return labels.ongoing;
  // Invalid or undefined means no date to show
  if (!isValidDateString(dateStr)) return '';
  const [year, month] = dateStr!.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${labels.monthAbbreviations[monthIndex]} ${year}`;
}

// Format address for display
function formatAddress(address?: UserAddress): string {
  if (!address) return '';
  const parts: string[] = [];
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.country) parts.push(address.country);
  return parts.join(', ');
}

export function ResumePDF({
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
  locale = 'en',
}: ResumePDFProps) {
  const formattedAddress = formatAddress(address);
  const displayedProjects = projects?.slice(0, RESUME_CONFIG.pdfMaxProjects) || [];
  const displayedEducation = education?.slice(0, RESUME_CONFIG.educationMaxItems) || [];

  // Get font families and labels for the current locale
  const fonts = PDF_FONT_CONFIG.families[locale];
  const labels = PDF_LABELS[locale];
  const fontRegular = { fontFamily: fonts.regular };
  const fontBold = { fontFamily: fonts.bold, fontWeight: 700 as const };

  return (
    <Document>
      <Page size="A4" style={[styles.page, fontRegular]}>
        {/* Watermark for free tier users - fixed to appear on every page */}
        {hasWatermark && (
          <View style={styles.watermarkContainer} fixed>
            <Text style={styles.watermarkMainText}>{labels.watermarkMain}</Text>
            <Text style={styles.watermarkSubText}>{labels.watermarkSub}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.name, fontBold]}>{userName}</Text>
          {email && <Text style={styles.contact}>{email}</Text>}
          {phone && <Text style={styles.contact}>{phone}</Text>}
          {formattedAddress && <Text style={styles.contact}>{formattedAddress}</Text>}
          {targetJob && <Text style={styles.contact}>{labels.applyingFor} {targetJob}</Text>}
        </View>

        {/* Professional Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, fontBold]}>{labels.professionalSummary}</Text>
          <Text style={styles.summary}>{resumeContent.professionalSummary}</Text>
        </View>

        {/* Key Highlights */}
        {resumeContent.highlights.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, fontBold]}>{labels.keyHighlights}</Text>
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
          <Text style={[styles.sectionTitle, fontBold]}>{labels.skills}</Text>
          {resumeContent.skills
            .map((category: ResumeSkillGroup) => ({
              ...category,
              // Filter out empty/blank skill names
              skills: category.skills.filter(skill =>
                skill.name && skill.name.trim() !== '' && skill.name !== 'undefined' && skill.name !== 'null'
              ),
            }))
            // Only render categories that have at least one valid skill
            .filter(category => category.skills.length > 0)
            .map((category, catIndex: number) => (
            <View key={catIndex} style={styles.skillCategory} wrap={false}>
              <Text style={[styles.skillCategoryTitle, fontBold]}>{category.category}</Text>
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
            <Text style={[styles.sectionTitle, fontBold]}>{labels.workExperience}</Text>
            {experience.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={[styles.experienceTitle, fontBold]}>{exp.title}</Text>
                  <Text style={styles.experienceDate}>
                    {formatDate(exp.startDate, labels)} - {formatDate(exp.endDate, labels)}
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

        {/* Education */}
        {displayedEducation.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, fontBold]}>{labels.education}</Text>
            {displayedEducation.map((edu, index) => {
              const hasStartDate = isValidDateString(edu.startDate);
              const hasEndDate = isValidDateString(edu.endDate);
              const showDateRange = hasStartDate || hasEndDate || edu.endDate === null;
              return (
                <View key={index} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={[styles.projectName, fontBold]}>{edu.school}</Text>
                    {showDateRange && (
                      <Text style={styles.projectDate}>
                        {hasStartDate ? formatDate(edu.startDate, labels) : ''}
                        {hasStartDate ? ' - ' : ''}
                        {formatDate(edu.endDate, labels)}
                      </Text>
                    )}
                  </View>
                  {[edu.degree, edu.fieldOfStudy].filter(v => v && v !== 'undefined' && v !== 'null').length > 0 && (
                    <Text style={styles.experienceCompany}>
                      {[edu.degree, edu.fieldOfStudy].filter(v => v && v !== 'undefined' && v !== 'null').join(' • ')}
                    </Text>
                  )}
                  {edu.location && edu.location !== 'undefined' && edu.location !== 'null' && (
                    <Text style={styles.projectDescription}>{edu.location}</Text>
                  )}
                  {edu.description && edu.description !== 'undefined' && edu.description !== 'null' && (
                    <Text style={styles.projectDescription}>{edu.description}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Projects */}
        {displayedProjects.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, fontBold]}>{labels.projects}</Text>
            {displayedProjects.map((proj, index) => {
              const hasStartDate = isValidDateString(proj.startDate);
              const hasEndDate = isValidDateString(proj.endDate);
              const isOngoing = proj.endDate === null;
              const showDateRange = hasStartDate || hasEndDate || isOngoing;
              const technologies = (proj.technologies || []).filter(t => t && t !== 'undefined' && t !== 'null');
              return (
                <View key={index} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={[styles.projectName, fontBold]}>{proj.name}</Text>
                    {showDateRange && (
                      <Text style={styles.projectDate}>
                        {hasStartDate ? formatProjectDate(proj.startDate, labels) : ''}
                        {hasStartDate && (hasEndDate || isOngoing) ? ' - ' : ''}
                        {isOngoing ? labels.ongoing : (hasEndDate ? formatProjectDate(proj.endDate, labels) : '')}
                      </Text>
                    )}
                  </View>
                  {proj.url && proj.url !== 'undefined' && proj.url !== 'null' && (
                    <Link src={proj.url} style={styles.projectUrl}>
                      {proj.url}
                    </Link>
                  )}
                  {proj.description && proj.description !== 'undefined' && proj.description !== 'null' && (
                    <Text style={styles.projectDescription}>{proj.description}</Text>
                  )}
                  {technologies.length > 0 && (
                    <View style={styles.projectTechnologies}>
                      {technologies.slice(0, 8).map((tech, techIndex) => (
                        <Text key={techIndex} style={styles.projectTech}>{tech}</Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

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
