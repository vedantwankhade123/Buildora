import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fetch all API keys for a user (GET /api/apikeys?uid=...)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  const apiKeys = await prisma.apiKey.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ apiKeys });
}

// Create a new API key (POST /api/apikeys)
export async function POST(req: NextRequest) {
  const { uid, provider, key } = await req.json();
  if (!uid || !provider || !key) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const apiKey = await prisma.apiKey.create({ data: { userId: uid, provider, key } });
  return NextResponse.json({ apiKey });
} 