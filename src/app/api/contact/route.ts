import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  subject: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().min(10).max(3000),
  company: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    // Silently accept honeypot submissions so bots do not learn they were caught.
    if (data.company) return NextResponse.json({ ok: true });

    await prisma.enquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || null,
        message: data.message,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof z.ZodError ? 'Please complete all required fields.' : 'Could not send your message.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
