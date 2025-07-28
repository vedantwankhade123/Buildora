import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fetch all chats for a user (GET /api/chats?uid=...)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  const chats = await prisma.chat.findMany({ where: { userId: uid }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json({ chats });
}

// Create a new chat (POST /api/chats)
export async function POST(req: NextRequest) {
  const { uid, messages } = await req.json();
  if (!uid || !messages) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const chat = await prisma.chat.create({ data: { userId: uid, messages } });
  return NextResponse.json({ chat });
} 