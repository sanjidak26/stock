import { createClient } from '@libsql/client';
import path from 'path';

let client;

export function getDb() {
  if (!client) {
    const dbPath = path.join(process.cwd(), 'data', 'stockeasy.db');
    client = createClient({ url: `file:${dbPath}` });
  }
  return client;
}

export async function initDb() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      drug_license_no TEXT,
      gst_no TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'shop_staff',
      shop_id INTEGER REFERENCES shops(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL REFERENCES shops(id),
      name TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL REFERENCES shops(id),
      name TEXT NOT NULL,
      generic_name TEXT,
      category TEXT,
      unit TEXT NOT NULL DEFAULT 'tablet',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL REFERENCES shops(id),
      medicine_id INTEGER NOT NULL REFERENCES medicines(id),
      dealer_id INTEGER REFERENCES dealers(id),
      batch_no TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      quantity_total INTEGER NOT NULL DEFAULT 0,
      quantity_remaining INTEGER NOT NULL DEFAULT 0,
      purchase_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL REFERENCES shops(id),
      bill_no TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL REFERENCES bills(id),
      batch_id INTEGER NOT NULL REFERENCES batches(id),
      medicine_id INTEGER NOT NULL REFERENCES medicines(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL REFERENCES shops(id),
      user_id INTEGER REFERENCES users(id),
      question TEXT NOT NULL,
      generated_query TEXT,
      result_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed central admin if not exists
  const adminCheck = await db.execute("SELECT id FROM users WHERE role='central_admin' LIMIT 1");
  if (adminCheck.rows.length === 0) {
    const bcrypt = await import('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (name, email, password_hash, role, shop_id) VALUES ('Central Admin', 'admin@stockeasy.com', ?, 'central_admin', NULL)`,
      args: [hash],
    });
  }
}

// ─── Query helpers ───────────────────────────────────────────────────────────

export async function userByEmail(email) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE email=? LIMIT 1', args: [email] });
  return res.rows[0] || null;
}

export async function shopById(id) {
  const db = getDb();
  const res = await db.execute({ sql: 'SELECT * FROM shops WHERE id=? LIMIT 1', args: [id] });
  return res.rows[0] || null;
}

export async function getFEFOBatches(shopId, medicineId) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT b.*, m.name as medicine_name, m.unit, d.name as dealer_name
          FROM batches b
          JOIN medicines m ON b.medicine_id = m.id
          LEFT JOIN dealers d ON b.dealer_id = d.id
          WHERE b.shop_id=? AND b.medicine_id=? AND b.quantity_remaining > 0
          ORDER BY b.expiry_date ASC`,
    args: [shopId, medicineId],
  });
  return res.rows;
}

export async function createBillWithItems(shopId, billData, items, userId) {
  const db = getDb();
  const billNo = `BILL-${Date.now()}`;
  const now = new Date().toISOString();
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const discount = billData.discount || 0;
  const net = total - discount;

  const tx = await db.transaction('write');
  try {
    const billRes = await tx.execute({
      sql: `INSERT INTO bills (shop_id, bill_no, customer_name, customer_phone, total_amount, discount, net_amount, created_by, created_at)
            VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [shopId, billNo, billData.customerName || null, billData.customerPhone || null, total, discount, net, userId, now],
    });
    const billId = Number(billRes.lastInsertRowid);

    for (const item of items) {
      await tx.execute({
        sql: `INSERT INTO bill_items (bill_id, batch_id, medicine_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?,?)`,
        args: [billId, item.batchId, item.medicineId, item.quantity, item.unitPrice, item.subtotal],
      });
      await tx.execute({
        sql: `UPDATE batches SET quantity_remaining = quantity_remaining - ? WHERE id=? AND shop_id=?`,
        args: [item.quantity, item.batchId, shopId],
      });
    }

    await tx.commit();
    return { billId, billNo, net };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export async function getDashboardStats(shopId) {
  const db = getDb();

  const [rev, mrev, ne, ls, oos, tb] = await Promise.all([
    db.execute({ sql: `SELECT COALESCE(SUM(net_amount),0) as total FROM bills WHERE shop_id=? AND date(created_at)=date('now')`, args: [shopId] }),
    db.execute({ sql: `SELECT COALESCE(SUM(net_amount),0) as total FROM bills WHERE shop_id=? AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')`, args: [shopId] }),
    db.execute({ sql: `SELECT COUNT(*) as count FROM batches WHERE shop_id=? AND quantity_remaining>0 AND date(expiry_date) BETWEEN date('now') AND date('now','+30 days')`, args: [shopId] }),
    db.execute({ sql: `SELECT COUNT(DISTINCT medicine_id) as count FROM batches WHERE shop_id=? AND quantity_remaining>0 AND quantity_remaining<=10`, args: [shopId] }),
    db.execute({ sql: `SELECT COUNT(DISTINCT m.id) as count FROM medicines m WHERE m.shop_id=? AND NOT EXISTS (SELECT 1 FROM batches b WHERE b.medicine_id=m.id AND b.shop_id=? AND b.quantity_remaining>0)`, args: [shopId, shopId] }),
    db.execute({ sql: `SELECT COUNT(*) as count FROM bills WHERE shop_id=?`, args: [shopId] }),
  ]);

  return {
    todayRevenue: Number(rev.rows[0]?.total || 0),
    monthRevenue: Number(mrev.rows[0]?.total || 0),
    nearExpiryCount: Number(ne.rows[0]?.count || 0),
    lowStockCount: Number(ls.rows[0]?.count || 0),
    outOfStockCount: Number(oos.rows[0]?.count || 0),
    totalBills: Number(tb.rows[0]?.count || 0),
  };
}

export async function getRevenueChart(shopId, days = 30) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT date(created_at) as date, ROUND(SUM(net_amount),2) as revenue, COUNT(*) as bills
          FROM bills WHERE shop_id=? AND date(created_at) >= date('now', '-${days} days')
          GROUP BY date(created_at) ORDER BY date ASC`,
    args: [shopId],
  });
  return res.rows;
}

export async function getTopMedicines(shopId, limit = 10) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT m.name, SUM(bi.quantity) as sold, ROUND(SUM(bi.subtotal),2) as revenue
          FROM bill_items bi
          JOIN medicines m ON bi.medicine_id=m.id
          JOIN bills b ON bi.bill_id=b.id
          WHERE b.shop_id=?
          GROUP BY bi.medicine_id ORDER BY sold DESC LIMIT ?`,
    args: [shopId, limit],
  });
  return res.rows;
}

export async function getNearExpiryBatches(shopId, days = 30) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT b.*, m.name as medicine_name, m.unit
          FROM batches b JOIN medicines m ON b.medicine_id=m.id
          WHERE b.shop_id=? AND b.quantity_remaining>0
            AND date(b.expiry_date) BETWEEN date('now') AND date('now', '+${days} days')
          ORDER BY b.expiry_date ASC`,
    args: [shopId],
  });
  return res.rows;
}

export async function getAdminStats() {
  const db = getDb();
  const [total, pending, approved, revenue, bills] = await Promise.all([
    db.execute("SELECT COUNT(*) as c FROM shops"),
    db.execute("SELECT COUNT(*) as c FROM shops WHERE status='pending'"),
    db.execute("SELECT COUNT(*) as c FROM shops WHERE status='approved'"),
    db.execute("SELECT COALESCE(SUM(net_amount),0) as t FROM bills"),
    db.execute("SELECT COUNT(*) as c FROM bills"),
  ]);
  return {
    totalShops: Number(total.rows[0]?.c || 0),
    pendingShops: Number(pending.rows[0]?.c || 0),
    approvedShops: Number(approved.rows[0]?.c || 0),
    platformRevenue: Number(revenue.rows[0]?.t || 0),
    totalBills: Number(bills.rows[0]?.c || 0),
  };
}
