import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminGrowthStats, getAdminRevenueStats, getAdminStats, getTopShops } from '@/lib/mongoDb';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'central_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'stats';

  if (type === 'stats') {
    const stats = await getAdminStats();
    return Response.json(stats);
  }

  if (type === 'growth') {
    const rows = await getAdminGrowthStats();
    return Response.json(rows);
  }

  if (type === 'revenue') {
    const rows = await getAdminRevenueStats();
    return Response.json(rows);
  }

  if (type === 'top_shops') {
    const rows = await getTopShops();
    return Response.json(rows);
  }

  return Response.json({ error: 'Unknown type' }, { status: 400 });
}
