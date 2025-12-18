# Resume & Cover Letter Export

Users can generate professional PDF resumes and personalized cover letters based on their skill maps and work experience.

## Components

### Resume & Cover Letter (Integrated)
- `ResumeExportModal` - Multi-stage modal (input → generating → preview → pdfPreview → download)
  - Includes toggle to generate cover letter alongside resume
  - Tabbed preview for Resume and Cover Letter
  - ZIP download when cover letter is included
- `ResumePDF` - PDF template using @react-pdf/renderer with professional styling
- `CoverLetterPDF` - PDF template for cover letters with localized labels
- `PDFDownloadButton` - Wrapper for dynamic PDF download (avoids SSR issues)
- `PDFPreviewPanel` - Inline PDF viewer for resume using `PDFViewer`
- `CoverLetterPreviewPanel` - Inline PDF viewer for cover letter
- `pdfFonts.ts` - Centralized font registration and CJK hyphenation callback (prevents duplicate registration)
- `ExperienceEditor` - Modal for managing work experience entries
- `ProjectEditor` - Modal for managing portfolio projects

## Data Flow

1. Dashboard shows bio textarea, contact info, work experience, and projects
2. User clicks "Export Resume" → opens `ResumeExportModal`
3. User optionally enters job title, job posting URL, output language, and cover letter toggle
4. `POST /api/resume/generate` fetches user's skills from all career maps
5. If job URL provided, AI analyzes requirements
6. AI optimizes experience descriptions and generates tailored content (parallel)
7. If cover letter toggle enabled, `POST /api/cover-letter/generate` creates personalized letter
8. API checks subscription tier via `shouldHaveWatermark()`
9. Preview stage shows tabbed content (Resume | Cover Letter) with PDF options
10. User downloads PDF (single file) or ZIP (when cover letter included) via client-side rendering

## Resume Optimization (Automatic)

All resumes are automatically optimized with 5 techniques:

1. **Role-Targeted Rewrite** - Matches language and priorities from job description
2. **Impact Upgrade** - Rewrites experience with metrics, outcomes, strong verbs
3. **ATS Optimization** - Injects exact keywords from job description naturally
4. **Clarity & Tightening** - Removes filler, repetition, vague claims
5. **Strength Highlighting** - Identifies top 5 strengths, structures resume around them

## Language Selection & Translation

Users can select output language independent of UI language:
- English, Chinese (中文), Japanese (日本語)
- Defaults to current page locale
- AI translates all content to selected language:
  - Experience descriptions, job titles, locations
  - Education degrees, fields of study, locations
  - Project names and descriptions
  - Professional summary and highlights
- Company names, school names, and technology names are preserved in original form
- CJK fonts (Noto Sans SC/JP) registered for proper rendering
- Custom hyphenation callback enables proper Chinese/Japanese text wrapping

## PDF Options

- `showWatermark` toggle - Free tier forced ON, Pro/Premium can toggle
- `showFooter` toggle - Controls footer text display
- `includeCoverLetter` toggle - Generate cover letter alongside resume
- Toggles update PDF preview in real-time using `key` props
- When cover letter included, download as ZIP containing both PDFs (uses JSZip)

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
- Returns: profile, experience (optimized), resumeContent, jobRequirements, stats, hasWatermark

## AI Functions (`lib/ai-resume.ts`)

| Function | Purpose |
|----------|---------|
| `analyzeJobPosting()` | Extract requirements from job posting URL |
| `analyzeJobTitle()` | Infer requirements from job title only |
| `optimizeExperience()` | Rewrite experience with impact/ATS/clarity + translate |
| `optimizeEducation()` | Translate education entries (degree, field, location) |
| `optimizeProjects()` | Translate project entries (name, description) |
| `generateResumeContent()` | Generate summary, skills, highlights, strengths |
| `generateCoverLetter()` | Generate personalized cover letter with company connection |

## Cover Letter Generation

The cover letter feature creates personalized letters with:

1. **Opening Hook** - Compelling intro that shows immediate relevance
2. **Body Paragraphs** - 2-3 achievement highlights with metrics
3. **Company Connection** - Shows research and genuine interest
4. **Strong Closing** - Call to action with enthusiasm

### Cover Letter API

`POST /api/cover-letter/generate`:
- Input: `{ locale, jobTitle?, jobUrl?, companyUrl? }`
- Returns: profile, coverLetterContent (greeting, opening, body, closing, signature, keyStrengths, companyConnection)
- Credit cost: Same as resume generation (20 credits)

## Configuration (`RESUME_CONFIG`)

| Key | Value | Purpose |
|-----|-------|---------|
| `aiModel` | gpt-4o-mini | AI model for generation |
| `aiTemperature` | 0.5 | Temperature for content generation |
| `aiOptimizationTemperature` | 0.6 | Higher temp for creative rewrites |
| `maxKeywordsToInject` | 20 | Max ATS keywords per experience |
| `pdfMaxProjects` | 5 | Projects shown in PDF |

## Types

```typescript
interface ResumeContent {
  professionalSummary: string;
  skills: ResumeSkillGroup[];
  highlights: string[];
  topStrengths: string[];      // Top 5 identified strengths
  atsKeywordsUsed: string[];   // Keywords injected
}

interface OptimizedExperience {
  id: string;
  company: string;             // Preserved (not translated)
  title: string;               // Translated to target language
  startDate: string;
  endDate: string | null;
  description: string;         // AI-optimized + translated
  location?: string;           // Translated to target language
}

interface OptimizedEducation {
  id: string;
  school: string;              // Preserved (not translated)
  degree: string | null;       // Translated (e.g., "Bachelor" → "学士")
  fieldOfStudy: string | null; // Translated
  startDate: string | null;
  endDate: string | null;
  location: string | null;     // Translated
  description: string | null;  // Translated
}

interface OptimizedProject {
  id: string;
  name: string;                // Translated
  description: string;         // Translated
  url: string | null;          // Preserved
  technologies: string[];      // Preserved (not translated)
  startDate: string | null;
  endDate: string | null;
}
```

## Constants

PDF configuration is centralized in `lib/constants.ts`:
- `PDF_LABELS` - Section titles and labels in en/zh/ja:
  - Resume sections: Professional Summary, Skills, Work Experience, etc.
  - Footer text and URL (`footer`, `footerUrl`)
  - Watermark text (`watermarkMain`, `watermarkSub`, `watermarkDraft`)
  - Month abbreviations for date formatting
- `AI_LOCALE_INSTRUCTIONS` - Language prompts for AI generation
- `PDF_FONT_CONFIG` - CJK font URLs, font family mappings, date locale mappings, and CJK regex pattern
- `PDF_STYLES` - Shared style values for PDF components:
  - `colors.text` - Text color palette (primary, secondary, muted, etc.)
  - `colors.background` - Background colors
  - `colors.accent` - Accent colors (amber, cyan)
  - `colors.watermark` - Watermark colors
  - `borderRadius` - Border radius values (sm, md, lg)

## Font Management

CJK fonts and hyphenation are managed centrally in `pdfFonts.ts`:
- Single registration prevents duplicate font errors
- Uses `PDF_FONT_CONFIG.fontFamilies` for consistent font family names
- Smart hyphenation: CJK characters split individually, English words stay together
- AI prompts include instructions to use non-breaking spaces for compound terms (best effort)

**Font Selection by Locale:**
- All locales use Noto Sans fonts (loaded from Google Fonts CDN)
- English/Chinese: `NotoSansSC` - supports Latin + CJK, handles untranslated Chinese in English resumes
- Japanese: `NotoSansJP` - optimized for Japanese with full Latin support
- This ensures mixed-language content renders correctly even when AI translation is incomplete
