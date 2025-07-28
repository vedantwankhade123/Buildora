import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fetch all snippets for a user (GET /api/snippets?uid=...)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    const snippets = await prisma.snippet.findMany({ where: { userId: uid }, orderBy: { updatedAt: 'desc' } });
    return NextResponse.json({ snippets });
  } catch (error) {
    console.error('Error in GET /api/snippets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new snippet (POST /api/snippets)
export async function POST(req: NextRequest) {
  try {
    const { uid, title, code } = await req.json();
    if (!uid || !title || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const snippet = await prisma.snippet.create({ data: { userId: uid, title, code } });
    return NextResponse.json({ snippet });
  } catch (error) {
    console.error('Error in POST /api/snippets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 