import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fetch all chats for a user (GET /api/chats?uid=...)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    const chats = await prisma.chat.findMany({ where: { userId: uid }, orderBy: { updatedAt: 'desc' } });
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error in GET /api/chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new chat (POST /api/chats)
export async function POST(req: NextRequest) {
  try {
    const { uid, messages } = await req.json();
    if (!uid || !messages) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const chat = await prisma.chat.create({ data: { userId: uid, messages } });
    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error in POST /api/chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 