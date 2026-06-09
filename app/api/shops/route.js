import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { initDb, listShops, registerShop } from '@/lib/mongoDb';

// POST /api/shops — public registration
export async function POST(request) {
  try {
    await initDb();
    const body = await request.json();
    const { shopName, ownerName, email, password, phone, address, drugLicenseNo, gstNo } = body;

    if (!shopName || !ownerName || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hash = bcrypt.hashSync(password, 10);
    await registerShop({
      shopName,
      ownerName,
      email,
      passwordHash: hash,
      phone,
      address,
      drugLicenseNo,
      gstNo,
    });

    return Response.json({ ok: true, message: 'Registration submitted. Await admin approval.' }, { status: 201 });
  } catch (e) {
    if (String(e?.message || '').includes('E11000')) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/shops — admin: list all shops
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'central_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const rows = await listShops(status || null);
  return Response.json(rows);
}
