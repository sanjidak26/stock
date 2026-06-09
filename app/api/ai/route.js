import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordAiQuery, runAiQuery } from '@/lib/mongoDb';

// POST /api/ai — plain English to SQL query
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = Number(session.user.shopId);
  const userId = Number(session.user.userId);

  const { question } = await request.json();
  if (!question) return Response.json({ error: 'Question required' }, { status: 400 });

  try {
    const result = await runAiQuery(question, shopId);
    await recordAiQuery(shopId, userId, question, result.query, `${result.rows.length} rows returned`);

    return Response.json({ rows: result.rows, query: result.query, count: result.rows.length });
  } catch (e) {
    return Response.json({ error: 'Query failed: ' + e.message }, { status: 500 });
  }
}
