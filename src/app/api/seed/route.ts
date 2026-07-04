import { NextResponse } from 'next/server';
import seedDatabase from '@/db/seed';

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('[seed]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
