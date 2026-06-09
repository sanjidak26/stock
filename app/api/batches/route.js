import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createBatch, listBatches } from '@/lib/mongoDb';

// GET /api/batches?medicineId=xxx
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { searchParams } = new URL(request.url);
  const medicineId = searchParams.get('medicineId');
  const filter = searchParams.get('filter'); // near_expiry | low_stock | out_of_stock | all
  const rows = await listBatches({ shopId, filter: filter || 'all', medicineId: medicineId ? Number(medicineId) : null, nearExpiryDays: 90 });
  return Response.json(rows);
}

// POST /api/batches
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === 'shop_staff') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { medicineId, dealerId, batchNo, expiryDate, quantity, purchasePrice, sellingPrice } = await request.json();
  if (!medicineId || !batchNo || !expiryDate || !quantity) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const id = await createBatch(shopId, { medicineId, dealerId, batchNo, expiryDate, quantity, purchasePrice, sellingPrice });
  return Response.json({ id, ok: true }, { status: 201 });
}
