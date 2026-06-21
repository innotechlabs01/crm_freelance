import { NextResponse } from 'next/server';
import seedDatabase from '@/db/seed';

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
