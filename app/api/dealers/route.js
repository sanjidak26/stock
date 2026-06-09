import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDealer, deleteDealer, listDealers } from '@/lib/mongoDb';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);
  const rows = await listDealers(shopId);
  return Response.json(rows);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'shop_staff') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { name, contactName, phone, email, address } = await request.json();
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 });
  const id = await createDealer(shopId, { name, contactName, phone, email, address });
  return Response.json({ id, ok: true }, { status: 201 });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'shop_staff') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

  await deleteDealer(shopId, id);
  return Response.json({ ok: true });
}
