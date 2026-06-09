import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDashboardStats, getRevenueChart, getTopMedicines, getNearExpiryBatches, getExpiredBatchesWithLoss } from '@/lib/mongoDb';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'dashboard';
  const days = Number(searchParams.get('days') || 30);

  if (type === 'dashboard') {
    const stats = await getDashboardStats(shopId);
    return Response.json(stats);
  }

  if (type === 'revenue') {
    const data = await getRevenueChart(shopId, days);
    return Response.json(data);
  }

  if (type === 'top_medicines') {
    const data = await getTopMedicines(shopId, 10);
    return Response.json(data);
  }

  if (type === 'near_expiry') {
    const data = await getNearExpiryBatches(shopId, days);
    return Response.json(data);
  }

  if (type === 'expiry_loss') {
    const data = await getExpiredBatchesWithLoss(shopId);
    return Response.json(data);
  }

  return Response.json({ error: 'Unknown type' }, { status: 400 });
}
