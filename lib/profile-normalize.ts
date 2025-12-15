import { RESUME_CONFIG } from './constants';
import type { UserAddress, WorkExperience, Project, Education } from './schemas';

export const clampString = (value: string | undefined | null, max: number): string => {
  if (!value) return '';
  return value.slice(0, max);
};

// Remove unsupported address fields and clamp lengths
export const sanitizeAddress = (value: UserAddress = {}): UserAddress => {
  const { city, state, country } = value;
  return {
    ...(city ? { city: clampString(city, RESUME_CONFIG.addressCityMaxLength) } : {}),
    ...(state ? { state: clampString(state, RESUME_CONFIG.addressStateMaxLength) } : {}),
    ...(country ? { country: clampString(country, RESUME_CONFIG.addressCountryMaxLength) } : {}),
  };
};

export const normalizeExperience = (exp: WorkExperience): WorkExperience => ({
  id: exp.id,
  company: clampString(exp.company, RESUME_CONFIG.experienceCompanyMaxLength),
  title: clampString(exp.title, RESUME_CONFIG.experienceTitleMaxLength),
  startDate: exp.startDate || '',
  endDate: exp.endDate ?? null,
  description: clampString(exp.description, RESUME_CONFIG.experienceDescriptionMaxLength),
  location: exp.location ? clampString(exp.location, RESUME_CONFIG.experienceLocationMaxLength) : undefined,
});

export const normalizeProject = (proj: Project): Project => ({
  id: proj.id,
  name: clampString(proj.name, RESUME_CONFIG.projectNameMaxLength),
  description: clampString(proj.description, RESUME_CONFIG.projectDescriptionMaxLength),
  url: proj.url ? clampString(proj.url, RESUME_CONFIG.projectUrlMaxLength) : undefined,
  technologies: (proj.technologies || [])
    .map(tech => clampString(tech, RESUME_CONFIG.projectTechnologyMaxLength))
    .filter(Boolean)
    .slice(0, RESUME_CONFIG.projectTechnologiesMaxItems),
  startDate: proj.startDate || undefined,
  endDate: proj.endDate ?? null,
});

export const normalizeEducation = (edu: Education): Education => ({
  id: edu.id,
  school: clampString(edu.school, RESUME_CONFIG.educationSchoolMaxLength),
  degree: edu.degree ? clampString(edu.degree, RESUME_CONFIG.educationDegreeMaxLength) : undefined,
  fieldOfStudy: edu.fieldOfStudy ? clampString(edu.fieldOfStudy, RESUME_CONFIG.educationFieldMaxLength) : undefined,
  startDate: edu.startDate || undefined,
  endDate: edu.endDate ?? null,
  description: edu.description ? clampString(edu.description, RESUME_CONFIG.educationDescriptionMaxLength) : undefined,
  location: edu.location ? clampString(edu.location, RESUME_CONFIG.educationLocationMaxLength) : undefined,
});
