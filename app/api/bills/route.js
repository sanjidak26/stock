import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBillWithItems, listBills } from '@/lib/mongoDb';

// GET /api/bills?page=1&search=xxx
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const billId = searchParams.get('id');

  // Single bill with items
  if (billId) {
    const details = await getBillWithItems(shopId, billId);
    if (!details) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(details);
  }

  // List bills
  const rows = await listBills(shopId, search);
  return Response.json(rows);
}
