import { initDb } from '@/lib/mongoDb';

export async function GET() {
  try {
    await initDb();
    return Response.json({ ok: true, message: 'Database initialized' });
  } catch (e) {
    console.error('DB init error:', e);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
