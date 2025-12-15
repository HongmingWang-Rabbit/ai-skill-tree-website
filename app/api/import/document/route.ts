import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentImportSchema } from '@/lib/schemas';
import { parsePDF, parseWord, parseText, parseImage, isSupportedFileType, isImageFile, getMimeType, type DocumentParseError } from '@/lib/document-parser';
import { extractSkillsFromDocument, generateExtractionSummary } from '@/lib/ai-document';
import { DOCUMENT_IMPORT_CONFIG, SUPPORTED_EXTENSIONS } from '@/lib/constants';
import { type Locale } from '@/i18n/routing';
import { hasEnoughCredits, deductCredits, type CreditDeductResult } from '@/lib/credits';

// Cannot use edge runtime due to pdf-parse requiring Node.js
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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
    const isVisionDocument = isImageFile(file.name);

    // Check credits for logged-in users before AI extraction
    if (session?.user?.id) {
      const creditOperation = isVisionDocument ? 'import_document_vision' : 'import_document';
      const creditCheck = await hasEnoughCredits(session.user.id, creditOperation);
      if (!creditCheck.sufficient) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS',
            creditsRequired: creditCheck.required,
            creditsBalance: creditCheck.balance,
          },
          { status: 402 }
        );
      }
    }

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

    // Deduct credits after successful extraction
    let deductResult: CreditDeductResult | undefined;
    if (session?.user?.id) {
      const creditOperation = isVisionDocument ? 'import_document_vision' : 'import_document';
      deductResult = await deductCredits(session.user.id, creditOperation, {
        fileName: file.name,
        fileType: parsedDocument.metadata.type,
        isVision: isVisionDocument,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        nodes: result.nodes,
        edges: result.edges,
        suggestedTitle: result.suggestedTitle,
        confidence: result.confidence,
        bio: result.bio,
        phone: result.phone,
        address: result.address,
        experience: result.experience,
        projects: result.projects,
        education: result.education,
        summaries,
        documentInfo: {
          type: parsedDocument.metadata.type,
          title: parsedDocument.metadata.title,
          wordCount: parsedDocument.metadata.wordCount,
        },
      },
      credits: deductResult ? { balance: deductResult.newBalance } : undefined,
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
