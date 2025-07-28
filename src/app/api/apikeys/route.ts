import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fetch all API keys for a user (GET /api/apikeys?uid=...)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    const apiKeys = await prisma.apiKey.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error in GET /api/apikeys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new API key (POST /api/apikeys)
export async function POST(req: NextRequest) {
  try {
    const { uid, provider, key } = await req.json();
    if (!uid || !provider || !key) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const apiKey = await prisma.apiKey.create({ data: { userId: uid, provider, key } });
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('Error in POST /api/apikeys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 