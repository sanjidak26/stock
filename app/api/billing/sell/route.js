import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createBillWithItems, validateBatchStock } from '@/lib/mongoDb';

// POST /api/billing/sell
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);
  const userId = Number(session.user.userId);

  const { customerName, customerPhone, discount, items } = await request.json();

  if (!items || items.length === 0) {
    return Response.json({ error: 'No items in bill' }, { status: 400 });
  }

  for (const item of items) {
    const batch = await validateBatchStock(shopId, item.batchId);
    if (!batch || batch.quantity_remaining < item.quantity) {
      return Response.json({ error: `Insufficient stock for batch #${item.batchId}` }, { status: 400 });
    }
  }

  const result = await createBillWithItems(shopId, { customerName, customerPhone, discount }, items, userId);
  return Response.json(result, { status: 201 });
}
