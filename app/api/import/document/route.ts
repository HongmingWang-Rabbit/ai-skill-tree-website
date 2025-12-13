import { NextRequest, NextResponse } from 'next/server';
import { DocumentImportSchema } from '@/lib/schemas';
import { parsePDF, parseWord, parseText, parseImage, isSupportedFileType, isImageFile, getMimeType, type DocumentParseError } from '@/lib/document-parser';
import { extractSkillsFromDocument, generateExtractionSummary } from '@/lib/ai-document';
import { DOCUMENT_IMPORT_CONFIG, SUPPORTED_EXTENSIONS } from '@/lib/constants';
import { type Locale } from '@/i18n/routing';

// Cannot use edge runtime due to pdf-parse requiring Node.js
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const locale = (formData.get('locale') as string) || 'en';

    // Parse optional existing context for update mode
    const existingNodesStr = formData.get('existingNodes') as string | null;
    const existingEdgesStr = formData.get('existingEdges') as string | null;

    let existingContext: { nodes: unknown[]; edges: unknown[] } | undefined;
    if (existingNodesStr && existingEdgesStr) {
      try {
        existingContext = {
          nodes: JSON.parse(existingNodesStr),
          edges: JSON.parse(existingEdgesStr),
        };
      } catch {
        // Ignore parse errors for optional context
      }
    }

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > DOCUMENT_IMPORT_CONFIG.maxFileSizeBytes) {
      const maxMB = DOCUMENT_IMPORT_CONFIG.maxFileSizeBytes / (1024 * 1024);
      return NextResponse.json(
        { success: false, error: `File size exceeds ${maxMB}MB limit` },
        { status: 400 }
      );
    }

    // Check file type
    if (!isSupportedFileType(file.name)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Parse the document based on type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    let parsedDocument;

    try {
      if (fileExtension === 'pdf') {
        const buffer = Buffer.from(await file.arrayBuffer());
        parsedDocument = await parsePDF(buffer);
      } else if (fileExtension === 'doc' || fileExtension === 'docx') {
        const buffer = Buffer.from(await file.arrayBuffer());
        parsedDocument = await parseWord(buffer, file.name);
      } else if (isImageFile(file.name)) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = getMimeType(file.name) || 'image/png';
        parsedDocument = parseImage(buffer, mimeType, file.name);
      } else {
        // Text or markdown
        const text = await file.text();
        parsedDocument = parseText(text, file.name);
      }
    } catch (error) {
      const parseError = error as DocumentParseError;
      return NextResponse.json(
        {
          success: false,
          error: parseError.message || 'Failed to parse document',
          code: parseError.code,
        },
        { status: 400 }
      );
    }

    // Validate locale
    const validatedInput = DocumentImportSchema.parse({
      locale,
      existingNodes: existingContext?.nodes,
      existingEdges: existingContext?.edges,
    });

    // Extract skills using AI
    const result = await extractSkillsFromDocument(
      parsedDocument,
      validatedInput.locale as Locale,
      validatedInput.existingNodes && validatedInput.existingEdges
        ? {
            nodes: validatedInput.existingNodes,
            edges: validatedInput.existingEdges,
          }
        : undefined
    );

    // Generate human-readable summary
    const summaries = generateExtractionSummary(result, validatedInput.locale as Locale);

    return NextResponse.json({
      success: true,
      data: {
        nodes: result.nodes,
        edges: result.edges,
        suggestedTitle: result.suggestedTitle,
        confidence: result.confidence,
        bio: result.bio,
        experience: result.experience,
        summaries,
        documentInfo: {
          type: parsedDocument.metadata.type,
          title: parsedDocument.metadata.title,
          wordCount: parsedDocument.metadata.wordCount,
        },
      },
    });
  } catch (error) {
    console.error('Document import error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
