import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createMedicine, deleteMedicine, listMedicines } from '@/lib/mongoDb';

// GET /api/medicines?search=xxx
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const rows = await listMedicines(shopId, search);
  return Response.json(rows);
}

// POST /api/medicines
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'shop_staff') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { name, genericName, category, unit } = await request.json();
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 });
  const id = await createMedicine(shopId, { name, genericName, category, unit });
  return Response.json({ id, ok: true }, { status: 201 });
}

// DELETE /api/medicines?id=xxx
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'shop_staff') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

  await deleteMedicine(shopId, id);
  return Response.json({ ok: true });
}
