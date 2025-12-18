# Document Import Feature

Users can import skills, contact info, professional bio, work experience, and projects from resumes, portfolios, or web profiles to create or update skill maps.

## Supported Input Types

- PDF files (resumes, CVs)
- Word documents (.doc, .docx)
- Images (.png, .jpg, .gif, .webp) - uses GPT-4o vision
- Text/Markdown files
- URLs (LinkedIn profiles, GitHub, personal websites)

## Entry Points

1. Dashboard: Import button creates new skill maps from documents
2. AI Chat: "Import from document" suggestion updates existing maps

## Extracted Data

- Skills with categories, levels, and confidence scores
- Contact info (phone number, address with city/state/country/postal code)
- Professional bio/summary (2-4 sentences)
- Work experience (company, title, dates, location, description)
- Portfolio projects (name, description, URL, technologies, dates)

## Data Flow

1. User uploads file or enters URL
2. `POST /api/import/document` or `POST /api/import/url` parses content
3. `lib/document-parser.ts` extracts text:
   - PDF: `pdf-parse` (dynamically imported for serverless compatibility)
   - Word: `mammoth`
   - URLs: `cheerio` + `@extractus/article-extractor`
4. `lib/ai-document.ts` uses OpenAI to extract skills, contact info, bio, experience, and projects
5. For LinkedIn/login-walled sites, Tavily API provides fallback content extraction
6. Preview modal shows extracted data with confidence indicators
7. User confirms → skills converted to SkillNodes, profile data saved

**Note:** `pdf-parse` uses dynamic import (`await import('pdf-parse')`) to prevent `pdfjs-dist` from loading in serverless environments where canvas APIs aren't available. This avoids `DOMMatrix is not defined` errors in routes that import `document-parser.ts` but don't parse PDFs.

## Components

- `DocumentImportModal` - Tab-based modal for file upload or URL input
- `ImportPreview` - Shows extracted data before confirmation
- `FileDropzone` - Drag-and-drop file upload with validation

## API Routes

- `POST /api/import/document` - Multipart form upload for files (uses nodejs runtime)
- `POST /api/import/url` - JSON body with URL to import

## Configuration

`DOCUMENT_IMPORT_CONFIG` in `lib/constants.ts`:

- `maxFileSizeBytes`: 20MB limit
- `maxContentTokens`: 8000 tokens for content processing
- `minContentLength`: 50 chars minimum for valid document
- `charsPerToken`: 4 chars per token for truncation calculation
- `fileTypes`: Single source of truth for all supported file types
- `urlTimeout`: 30 seconds for URL fetching
- `portfolioDomains`: Domains to detect as portfolio sites
- `aiExtraction`:
  - `textModel`: gpt-4o-mini for text documents
  - `visionModel`: GPT-4o for image analysis
  - `maxTokens`: 4000 tokens for AI responses
  - `temperature`: 0.5 for extraction
  - `minSkills`: 10, `maxSkills`: 25
  - `importedSkillProgress`: 100 (skills marked as learned)
- `preview`:
  - `maxDisplayedSkillsPerCategory`: 8
  - `confidenceThresholds`: high (0.8), medium (0.5)
- `modal`: `maxHeightVh`: 85, `headerHeightPx`: 200

### Derived Constants

- `SUPPORTED_EXTENSIONS`: All supported file extensions
- `SUPPORTED_MIME_TYPES`: All supported MIME types
- `IMAGE_EXTENSIONS`: Image-only extensions
- `EXTENSION_TO_MIME`: Extension to MIME type mapping
- `SUPPORTED_FILE_ACCEPT`: HTML file input accept attribute string

## Smart Merge Behavior

When importing, the system uses fuzzy matching to intelligently merge with existing data instead of creating duplicates.

### Skill Maps
- Checks existing maps for similar title (60%+ similarity) or skill overlap (60%+ Jaccard similarity)
- If similar map found → updates it with new skills
- If no match → creates new map

### Profile Data Merging (`lib/import-merge.ts`)
- **Bio**: Merges if different, keeps if too similar (70%+ threshold)
- **Work Experience**: Fuzzy matches by company+title (weighted 60%/40%), updates similar entries
- **Projects**: Fuzzy matches by name or exact URL match, merges technologies
- **Education**: Fuzzy matches by school name, updates similar entries
- **Contact Info**: Phone only updated if not already set; address fields merged

### Configuration (`IMPORT_MERGE_CONFIG` in `lib/constants.ts`)
- `similarityThreshold`: 0.6 (60% for general matching)
- `bioSimilarityThreshold`: 0.7 (70% for bio - only merge if significantly different)
- `dateMatchBoost`: 0.8 (effective similarity when dates match exactly)
- `degreeMatchThreshold`: 0.5 (more lenient for degree matching)
- `companyWeight`/`titleWeight`: 0.6/0.4 (company name weighted higher)

## Update vs Create Mode

- Dashboard: Smart merge with existing maps or create new (`mode='create'`)
- AI Chat: Updates existing maps (`mode='update'`), filtering out duplicate skills
