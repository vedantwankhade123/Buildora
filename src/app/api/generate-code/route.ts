import { NextRequest, NextResponse } from 'next/server';
import { generateCode } from '@/ai/flows/generate-code-from-canvas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateCode(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
} 