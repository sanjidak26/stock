import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setShopStatus } from '@/lib/mongoDb';

// POST /api/admin/verify — approve or reject shop
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'central_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { shopId, action, reason } = await request.json();
  if (!shopId || !action) return Response.json({ error: 'Missing fields' }, { status: 400 });

  if (action !== 'approve' && action !== 'reject') {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  await setShopStatus(shopId, action, reason);

  return Response.json({ ok: true });
}
