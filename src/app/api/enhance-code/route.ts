import { NextRequest, NextResponse } from 'next/server';
import { enhanceCodeSnippet } from '@/ai/flows/enhance-code-snippets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await enhanceCodeSnippet(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error enhancing code:', error);
    return NextResponse.json(
      { error: 'Failed to enhance code' },
      { status: 500 }
    );
  }
} 