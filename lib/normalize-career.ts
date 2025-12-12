import { SHARE_SLUG_LENGTH, SHARE_SLUG_CHARS } from './constants';

export function normalizeCareerKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatCareerTitle(key: string): string {
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Generate a short, URL-friendly share slug
export function generateShareSlug(): string {
  let slug = '';
  for (let i = 0; i < SHARE_SLUG_LENGTH; i++) {
    slug += SHARE_SLUG_CHARS.charAt(Math.floor(Math.random() * SHARE_SLUG_CHARS.length));
  }
  return slug;
}

// Check if a string is a valid UUID
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Check if a string is a share slug (alphanumeric characters matching SHARE_SLUG_LENGTH)
export function isShareSlug(str: string): boolean {
  const regex = new RegExp(`^[a-z0-9]{${SHARE_SLUG_LENGTH}}$`);
  return regex.test(str);
}
