/**
 * Smart import merging utilities
 * Handles intelligent merging of imported data with existing profile data
 */

import type { WorkExperience, Project, Education, SkillNode } from './schemas';
import { IMPORT_MERGE_CONFIG } from './constants';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normalizedA = a.toLowerCase().trim();
  const normalizedB = b.toLowerCase().trim();

  if (normalizedA === normalizedB) return 1;
  if (normalizedA.length === 0 || normalizedB.length === 0) return 0;

  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  const distance = levenshteinDistance(normalizedA, normalizedB);

  return 1 - distance / maxLen;
}

/**
 * Check if two strings are similar enough to be considered the same item
 */
export function isSimilar(a: string, b: string, threshold = IMPORT_MERGE_CONFIG.similarityThreshold): boolean {
  return stringSimilarity(a, b) >= threshold;
}

// ============================================
// Bio Merging
// ============================================

interface BioMergeResult {
  bio: string;
  action: 'kept' | 'replaced' | 'merged';
}

/**
 * Smart merge of bio strings
 * - If existing is empty, use new
 * - If new is empty, keep existing
 * - If very similar, keep existing (no change needed)
 * - If different, combine them intelligently
 */
export function mergeBio(existing: string | null | undefined, imported: string | null | undefined): BioMergeResult {
  const existingBio = existing?.trim() || '';
  const importedBio = imported?.trim() || '';

  // No existing bio - use imported
  if (!existingBio) {
    return { bio: importedBio, action: importedBio ? 'replaced' : 'kept' };
  }

  // No imported bio - keep existing
  if (!importedBio) {
    return { bio: existingBio, action: 'kept' };
  }

  // Check similarity
  const similarity = stringSimilarity(existingBio, importedBio);

  // Very similar - keep existing (no meaningful new info)
  if (similarity >= IMPORT_MERGE_CONFIG.bioSimilarityThreshold) {
    return { bio: existingBio, action: 'kept' };
  }

  // Check if one contains the other
  const existingLower = existingBio.toLowerCase();
  const importedLower = importedBio.toLowerCase();

  if (existingLower.includes(importedLower)) {
    return { bio: existingBio, action: 'kept' };
  }

  if (importedLower.includes(existingLower)) {
    return { bio: importedBio, action: 'replaced' };
  }

  // Different content - merge by combining (imported likely has newer/additional info)
  // Use imported as primary since it's from the most recent document
  const merged = `${importedBio} ${existingBio}`.trim();
  return { bio: merged, action: 'merged' };
}

// ============================================
// Work Experience Merging
// ============================================

interface ExperienceMatch {
  existing: WorkExperience;
  imported: WorkExperience;
  similarity: number;
}

/**
 * Find similar work experience entry
 */
export function findSimilarExperience(
  imported: WorkExperience,
  existingList: WorkExperience[]
): ExperienceMatch | null {
  let bestMatch: ExperienceMatch | null = null;

  for (const existing of existingList) {
    // Check company similarity
    const companySim = stringSimilarity(imported.company, existing.company);
    // Check title similarity
    const titleSim = stringSimilarity(imported.title, existing.title);

    // Combined similarity (weighted: company more important)
    const combinedSim = companySim * IMPORT_MERGE_CONFIG.companyWeight + titleSim * IMPORT_MERGE_CONFIG.titleWeight;

    // Also check for exact date match as a strong signal
    const sameStartDate = imported.startDate === existing.startDate;
    const effectiveSim = sameStartDate ? Math.max(combinedSim, IMPORT_MERGE_CONFIG.dateMatchBoost) : combinedSim;

    if (effectiveSim >= IMPORT_MERGE_CONFIG.similarityThreshold) {
      if (!bestMatch || effectiveSim > bestMatch.similarity) {
        bestMatch = { existing, imported, similarity: effectiveSim };
      }
    }
  }

  return bestMatch;
}

/**
 * Merge imported experience into existing one
 * Updates fields if imported has more content
 */
export function mergeExperience(existing: WorkExperience, imported: WorkExperience): WorkExperience {
  return {
    id: existing.id, // Keep existing ID
    company: imported.company.length > existing.company.length ? imported.company : existing.company,
    title: imported.title.length > existing.title.length ? imported.title : existing.title,
    // Use imported dates if they provide more info
    startDate: imported.startDate || existing.startDate,
    endDate: imported.endDate !== undefined ? imported.endDate : existing.endDate,
    // Use longer/more detailed description
    description: (imported.description?.length || 0) > (existing.description?.length || 0)
      ? imported.description
      : existing.description,
    location: imported.location || existing.location,
  };
}

/**
 * Smart merge of work experience arrays
 * Returns: merged array and counts of what happened
 */
export function mergeExperienceArrays(
  existing: WorkExperience[],
  imported: WorkExperience[],
  maxItems: number
): { merged: WorkExperience[]; added: number; updated: number } {
  const result = [...existing];
  let added = 0;
  let updated = 0;

  for (const imp of imported) {
    const match = findSimilarExperience(imp, result);

    if (match) {
      // Update existing entry
      const idx = result.findIndex(e => e.id === match.existing.id);
      if (idx !== -1) {
        result[idx] = mergeExperience(match.existing, imp);
        updated++;
      }
    } else {
      // Add as new entry
      result.push(imp);
      added++;
    }
  }

  // Sort by start date (most recent first) and limit
  return {
    merged: result
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      .slice(0, maxItems),
    added,
    updated,
  };
}

// ============================================
// Project Merging
// ============================================

/**
 * Find similar project entry
 */
export function findSimilarProject(
  imported: Project,
  existingList: Project[]
): Project | null {
  for (const existing of existingList) {
    const nameSim = stringSimilarity(imported.name, existing.name);

    // Also check URL if both have it
    const urlMatch = imported.url && existing.url && imported.url === existing.url;

    if (nameSim >= IMPORT_MERGE_CONFIG.similarityThreshold || urlMatch) {
      return existing;
    }
  }
  return null;
}

/**
 * Merge imported project into existing one
 */
export function mergeProject(existing: Project, imported: Project): Project {
  return {
    id: existing.id,
    name: imported.name.length > existing.name.length ? imported.name : existing.name,
    description: (imported.description?.length || 0) > (existing.description?.length || 0)
      ? imported.description
      : existing.description,
    url: imported.url || existing.url,
    // Merge technologies arrays
    technologies: [...new Set([...(existing.technologies || []), ...(imported.technologies || [])])],
    startDate: imported.startDate || existing.startDate,
    endDate: imported.endDate !== undefined ? imported.endDate : existing.endDate,
  };
}

/**
 * Smart merge of project arrays
 */
export function mergeProjectArrays(
  existing: Project[],
  imported: Project[],
  maxItems: number
): { merged: Project[]; added: number; updated: number } {
  const result = [...existing];
  let added = 0;
  let updated = 0;

  for (const imp of imported) {
    const match = findSimilarProject(imp, result);

    if (match) {
      const idx = result.findIndex(p => p.id === match.id);
      if (idx !== -1) {
        result[idx] = mergeProject(match, imp);
        updated++;
      }
    } else {
      result.push(imp);
      added++;
    }
  }

  return {
    merged: result.slice(0, maxItems),
    added,
    updated,
  };
}

// ============================================
// Education Merging
// ============================================

/**
 * Find similar education entry
 */
export function findSimilarEducation(
  imported: Education,
  existingList: Education[]
): Education | null {
  for (const existing of existingList) {
    const schoolSim = stringSimilarity(imported.school, existing.school);
    const degreeSim = stringSimilarity(imported.degree || '', existing.degree || '');

    // School must be similar, degree is a bonus
    if (schoolSim >= IMPORT_MERGE_CONFIG.similarityThreshold) {
      // If degrees also match somewhat, it's definitely the same
      if (!imported.degree || !existing.degree || degreeSim >= IMPORT_MERGE_CONFIG.degreeMatchThreshold) {
        return existing;
      }
    }
  }
  return null;
}

/**
 * Merge imported education into existing one
 */
export function mergeEducation(existing: Education, imported: Education): Education {
  return {
    id: existing.id,
    school: imported.school.length > existing.school.length ? imported.school : existing.school,
    degree: (imported.degree?.length || 0) > (existing.degree?.length || 0) ? imported.degree : existing.degree,
    fieldOfStudy: (imported.fieldOfStudy?.length || 0) > (existing.fieldOfStudy?.length || 0)
      ? imported.fieldOfStudy
      : existing.fieldOfStudy,
    startDate: imported.startDate || existing.startDate,
    endDate: imported.endDate !== undefined ? imported.endDate : existing.endDate,
    description: (imported.description?.length || 0) > (existing.description?.length || 0)
      ? imported.description
      : existing.description,
    location: imported.location || existing.location,
  };
}

/**
 * Smart merge of education arrays
 */
export function mergeEducationArrays(
  existing: Education[],
  imported: Education[],
  maxItems: number
): { merged: Education[]; added: number; updated: number } {
  const result = [...existing];
  let added = 0;
  let updated = 0;

  for (const imp of imported) {
    const match = findSimilarEducation(imp, result);

    if (match) {
      const idx = result.findIndex(e => e.id === match.id);
      if (idx !== -1) {
        result[idx] = mergeEducation(match, imp);
        updated++;
      }
    } else {
      result.push(imp);
      added++;
    }
  }

  return {
    merged: result.slice(0, maxItems),
    added,
    updated,
  };
}

// ============================================
// Skill Map Matching
// ============================================

export interface SavedCareerInfo {
  mapId: string;
  title: string;
  skills: string[]; // skill IDs or names
}

/**
 * Calculate skill overlap between two sets
 */
export function calculateSkillOverlap(skillsA: string[], skillsB: string[]): number {
  if (skillsA.length === 0 || skillsB.length === 0) return 0;

  const setA = new Set(skillsA.map(s => s.toLowerCase()));
  const setB = new Set(skillsB.map(s => s.toLowerCase()));

  let overlap = 0;
  for (const skill of setA) {
    if (setB.has(skill)) overlap++;
  }

  // Jaccard similarity
  const union = new Set([...setA, ...setB]).size;
  return overlap / union;
}

/**
 * Find the most similar existing skill map
 */
export function findSimilarSkillMap(
  importedTitle: string,
  importedSkills: SkillNode[],
  existingMaps: SavedCareerInfo[]
): { mapId: string; similarity: number; matchType: 'title' | 'skills' } | null {
  const importedSkillNames = importedSkills.map(s => s.name);
  let bestMatch: { mapId: string; similarity: number; matchType: 'title' | 'skills' } | null = null;

  for (const existing of existingMaps) {
    // Check title similarity
    const titleSim = stringSimilarity(importedTitle, existing.title);

    // Check skill overlap
    const skillOverlap = calculateSkillOverlap(importedSkillNames, existing.skills);

    // Use the higher of the two
    if (titleSim >= IMPORT_MERGE_CONFIG.similarityThreshold && (!bestMatch || titleSim > bestMatch.similarity)) {
      bestMatch = { mapId: existing.mapId, similarity: titleSim, matchType: 'title' };
    }

    if (skillOverlap >= IMPORT_MERGE_CONFIG.similarityThreshold && (!bestMatch || skillOverlap > bestMatch.similarity)) {
      bestMatch = { mapId: existing.mapId, similarity: skillOverlap, matchType: 'skills' };
    }
  }

  return bestMatch;
}
