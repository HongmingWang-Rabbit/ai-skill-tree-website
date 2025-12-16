# Resume Export Feature

Users can generate professional PDF resumes based on their skill maps and work experience.

## Components

- `ResumeExportModal` - Multi-stage modal (input → generating → preview → pdfPreview → download)
- `ResumePDF` - PDF template using @react-pdf/renderer with professional styling
- `PDFDownloadButton` - Wrapper for dynamic PDF download (avoids SSR issues)
- `PDFPreviewPanel` - Inline PDF viewer using `PDFViewer`
- `ExperienceEditor` - Modal for managing work experience entries
- `ProjectEditor` - Modal for managing portfolio projects

## Data Flow

1. Dashboard shows bio textarea, contact info, work experience, and projects
2. User clicks "Export Resume" → opens `ResumeExportModal`
3. User optionally enters job title or job posting URL
4. `POST /api/resume/generate` fetches user's skills from all career maps
5. If job URL provided, AI analyzes requirements
6. AI generates tailored resume content
7. API checks subscription tier via `shouldHaveWatermark()`
8. Preview stage shows content with PDF options (watermark/footer toggles)
9. User downloads PDF via `PDFDownloadLink` (client-side rendering)

## PDF Options

- `showWatermark` toggle - Free tier forced ON, Pro/Premium can toggle
- `showFooter` toggle - Controls footer text display
- Toggles update PDF preview in real-time using `key` props

## Watermark Feature

- Free tier users see watermark (configured in `BILLING_CONFIG.tiers.free.hasWatermark`)
- `shouldHaveWatermark(userId)` in `lib/subscription.ts` checks tier
- Uses text-based overlay for @react-pdf/renderer compatibility

## React-PDF Implementation Notes

- All PDF components use `next/dynamic` with `ssr: false`
- `isMounted` state pattern ensures client-side only rendering
- `key` props force remount when toggle states change
- Watermark uses `fixed` prop on `View` for every page

## API Route

`POST /api/resume/generate`:
- Input: `{ locale, jobTitle?, jobUrl? }`
- Returns: profile, experience, resumeContent, jobRequirements, stats, hasWatermark

## Database Schema (users table)

```typescript
bio: text           // Professional bio/summary
phone: text         // Contact phone number
address: jsonb      // UserAddress object
experience: jsonb   // Array of WorkExperience
projects: jsonb     // Array of Project
```

## Types

```typescript
interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string; // YYYY-MM format
  endDate: string | null; // null = current
  description: string;
  location?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies: string[];
  startDate?: string;
  endDate?: string | null; // null = ongoing
}

interface UserAddress {
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}
```

## Configuration

`RESUME_CONFIG` in `lib/constants.ts`:
- `bioMaxLength`: 500, `phoneMaxLength`: 30
- `experienceMaxItems`: 10, `projectsMaxItems`: 10
- `pdfMaxProjects`: 5, `pdfMaxSkillsPerCategory`: varies
- `aiModel`: gpt-4o-mini
- `pdfLabels`: Section titles for i18n including `watermarkMain`, `watermarkSub`

## AI Functions (`lib/ai-resume.ts`)

- `analyzeJobPosting(content, jobTitle, locale)` - Extract requirements
- `analyzeJobTitle(jobTitle, locale)` - Infer requirements from title
- `generateResumeContent(profile, careers, jobRequirements, locale)` - Generate content
