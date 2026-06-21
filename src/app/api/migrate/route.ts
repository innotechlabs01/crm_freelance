import { NextResponse } from 'next/server';
import { runMigrations } from '@/db/migrate';

export async function GET() {
  try {
    await runMigrations();
    return NextResponse.json({ success: true, message: 'Migrations executed' });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
