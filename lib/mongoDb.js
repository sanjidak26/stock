import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || 'stockeasy';

let client;
let database;
let initPromise;
let indexesReady = false;

function requireMongoUri() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }
}

function cleanDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

function cleanDocs(docs) {
  return docs.map((doc) => cleanDoc(doc));
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function utcDayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function isDateInRange(dateValue, start, end) {
  const value = new Date(dateValue);
  return value >= start && value <= end;
}

async function db() {
  await initDb();
  return database;
}

async function collection(name) {
  return (await db()).collection(name);
}

async function nextSequence(name, session) {
  if (!database) {
    await initDb();
  }

  const counters = database.collection('counters');
  // MongoDB driver v6+: findOneAndUpdate returns the document directly,
  // not wrapped in { value: doc } as in older drivers.
  // So result = { _id: name, value: N } → result.value is the counter.
  const result = await counters.findOneAndUpdate(
    { _id: name },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: 'after', ...(session ? { session } : {}) },
  );

  return Number(result?.value || 1);
}

async function ensureIndexes() {
  if (indexesReady) return;

  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('shops').createIndex({ email: 1 }, { unique: true }),
    database.collection('users').createIndex({ shop_id: 1, role: 1 }),
    database.collection('dealers').createIndex({ shop_id: 1, name: 1 }),
    database.collection('medicines').createIndex({ shop_id: 1, name: 1 }),
    database.collection('batches').createIndex({ shop_id: 1, medicine_id: 1, expiry_date: 1 }),
    database.collection('bills').createIndex({ shop_id: 1, created_at: -1 }),
    database.collection('bill_items').createIndex({ bill_id: 1 }),
    database.collection('ai_query_logs').createIndex({ shop_id: 1, created_at: -1 }),
  ]);

  indexesReady = true;
}

async function seedCentralAdmin() {
  const users = database.collection('users');
  const existing = await users.findOne({ role: 'central_admin' });
  if (existing) return;

  const nextId = await nextSequence('users');
  const hash = bcrypt.hashSync('admin123', 10);
  await users.insertOne({
    id: nextId,
    name: 'Central Admin',
    email: 'admin@stockeasy.com',
    password_hash: hash,
    role: 'central_admin',
    shop_id: null,
    created_at: new Date(),
  });
}

export async function initDb() {
  requireMongoUri();

  if (!initPromise) {
    initPromise = (async () => {
      if (!client) {
        client = new MongoClient(mongoUri);
        await client.connect();
      }

      if (!database) {
        database = client.db(mongoDbName);
      }

      await ensureIndexes();
      await seedCentralAdmin();
      return database;
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

export async function getDb() {
  return db();
}

export async function userByEmail(email) {
  const users = await collection('users');
  return cleanDoc(await users.findOne({ email }));
}

export async function shopById(id) {
  const shops = await collection('shops');
  return cleanDoc(await shops.findOne({ id: toNumber(id) }));
}

export async function registerShop(shopData) {
  const databaseHandle = await db();
  const session = client.startSession();

  try {
    session.startTransaction();

    const users = databaseHandle.collection('users');
    const shops = databaseHandle.collection('shops');

    const nextShopId = await nextSequence('shops', session);
    const nextUserId = await nextSequence('users', session);

    await shops.insertOne({
      id: nextShopId,
      name: shopData.shopName,
      owner_name: shopData.ownerName,
      address: shopData.address || null,
      phone: shopData.phone || null,
      email: shopData.email,
      drug_license_no: shopData.drugLicenseNo || null,
      gst_no: shopData.gstNo || null,
      status: 'pending',
      rejection_reason: null,
      created_at: new Date(),
    }, { session });

    await users.insertOne({
      id: nextUserId,
      name: shopData.ownerName,
      email: shopData.email,
      password_hash: shopData.passwordHash,
      role: 'shop_owner',
      shop_id: nextShopId,
      created_at: new Date(),
    }, { session });

    await session.commitTransaction();
    return nextShopId;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function listShops(status = null) {
  const databaseHandle = await db();
  const shops = await databaseHandle.collection('shops')
    .find(status ? { status } : {})
    .sort({ created_at: -1 })
    .toArray();
  const owners = await databaseHandle.collection('users')
    .find({ role: 'shop_owner' }, { projection: { shop_id: 1, email: 1 } })
    .toArray();

  const ownerMap = new Map(owners.map((owner) => [owner.shop_id, owner.email]));
  return cleanDocs(shops.map((shop) => ({ ...shop, owner_email: ownerMap.get(shop.id) || null })));
}

export async function createMedicine(shopId, medicineData) {
  const databaseHandle = await db();
  const medicines = databaseHandle.collection('medicines');
  const nextId = await nextSequence('medicines');

  await medicines.insertOne({
    id: nextId,
    shop_id: toNumber(shopId),
    name: medicineData.name,
    generic_name: medicineData.genericName || null,
    category: medicineData.category || null,
    unit: medicineData.unit || 'tablet',
    created_at: new Date(),
  });

  return nextId;
}

export async function deleteMedicine(shopId, id) {
  const medicines = await collection('medicines');
  await medicines.deleteOne({ id: toNumber(id), shop_id: toNumber(shopId) });
}

export async function createDealer(shopId, dealerData) {
  const databaseHandle = await db();
  const dealers = databaseHandle.collection('dealers');
  const nextId = await nextSequence('dealers');

  await dealers.insertOne({
    id: nextId,
    shop_id: toNumber(shopId),
    name: dealerData.name,
    contact_name: dealerData.contactName || null,
    phone: dealerData.phone || null,
    email: dealerData.email || null,
    address: dealerData.address || null,
    created_at: new Date(),
  });

  return nextId;
}

export async function deleteDealer(shopId, id) {
  const dealers = await collection('dealers');
  await dealers.deleteOne({ id: toNumber(id), shop_id: toNumber(shopId) });
}

export async function createBatch(shopId, batchData) {
  const databaseHandle = await db();
  const batches = databaseHandle.collection('batches');
  const nextId = await nextSequence('batches');

  await batches.insertOne({
    id: nextId,
    shop_id: toNumber(shopId),
    medicine_id: toNumber(batchData.medicineId),
    dealer_id: batchData.dealerId ? toNumber(batchData.dealerId) : null,
    batch_no: batchData.batchNo,
    expiry_date: new Date(batchData.expiryDate),
    quantity_total: Number(batchData.quantity || 0),
    quantity_remaining: Number(batchData.quantity || 0),
    purchase_price: Number(batchData.purchasePrice || 0),
    selling_price: Number(batchData.sellingPrice || 0),
    created_at: new Date(),
  });

  return nextId;
}

export async function listMedicines(shopId, search = '') {
  const databaseHandle = await db();
  const query = { shop_id: toNumber(shopId) };

  if (search) {
    const regex = { $regex: escapeRegExp(search), $options: 'i' };
    query.$or = [{ name: regex }, { generic_name: regex }];
  }

  const [medicines, batches] = await Promise.all([
    databaseHandle.collection('medicines').find(query).sort({ name: 1 }).toArray(),
    databaseHandle.collection('batches').find({ shop_id: toNumber(shopId) }).toArray(),
  ]);

  const batchMap = new Map();
  const now = new Date();
  for (const batch of batches) {
    const summary = batchMap.get(batch.medicine_id) || { stock: 0, nearest_expiry: null };
    const remaining = Number(batch.quantity_remaining || 0);
    summary.stock += remaining;
    if (remaining > 0) {
      const expiry = new Date(batch.expiry_date);
      // Only track nearest FUTURE expiry — expired batches should not mark
      // a medicine as expired when a valid future batch also exists.
      if (expiry > now) {
        if (!summary.nearest_expiry || expiry < new Date(summary.nearest_expiry)) {
          summary.nearest_expiry = expiry;
        }
      }
    }
    batchMap.set(batch.medicine_id, summary);
  }

  return cleanDocs(medicines.map((medicine) => {
    const summary = batchMap.get(medicine.id) || { stock: 0, nearest_expiry: null };
    return {
      ...medicine,
      stock: summary.stock,
      nearest_expiry: summary.nearest_expiry,
    };
  }));
}

export async function listDealers(shopId) {
  const dealers = await collection('dealers');
  const rows = await dealers.find({ shop_id: toNumber(shopId) }).sort({ name: 1 }).toArray();
  return cleanDocs(rows);
}

export async function listBatches({ shopId, filter = 'all', medicineId = null, nearExpiryDays = 90 }) {
  const databaseHandle = await db();
  const query = { shop_id: toNumber(shopId) };
  if (medicineId) {
    query.medicine_id = toNumber(medicineId);
  }

  const batches = await databaseHandle.collection('batches').find(query).toArray();
  const medicineIds = [...new Set(batches.map((batch) => batch.medicine_id))];
  const dealerIds = [...new Set(batches.map((batch) => batch.dealer_id).filter((value) => value !== null && value !== undefined))];

  const [medicines, dealers] = await Promise.all([
    medicineIds.length ? databaseHandle.collection('medicines').find({ id: { $in: medicineIds } }).toArray() : [],
    dealerIds.length ? databaseHandle.collection('dealers').find({ id: { $in: dealerIds } }).toArray() : [],
  ]);

  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const dealerMap = new Map(dealers.map((dealer) => [dealer.id, dealer]));
  const now = new Date();
  const expiryLimit = addUtcDays(now, nearExpiryDays);

  let rows = batches.map((batch) => {
    const medicine = medicineMap.get(batch.medicine_id) || {};
    const dealer = batch.dealer_id ? dealerMap.get(batch.dealer_id) : null;
    const row = {
      ...batch,
      medicine_name: medicine.name || null,
      unit: medicine.unit || null,
      dealer_name: dealer?.name || null,
    };

    if (filter === 'expired') {
      row.loss_value = money(Number(batch.quantity_remaining || 0) * Number(batch.purchase_price || 0));
    }

    return row;
  });

  if (filter === 'near_expiry') {
    rows = rows.filter((row) => Number(row.quantity_remaining || 0) > 0 && isDateInRange(row.expiry_date, now, expiryLimit));
    rows.sort((left, right) => new Date(left.expiry_date) - new Date(right.expiry_date));
  } else if (filter === 'low_stock') {
    rows = rows.filter((row) => Number(row.quantity_remaining || 0) > 0 && Number(row.quantity_remaining || 0) <= 10);
    rows.sort((left, right) => Number(left.quantity_remaining || 0) - Number(right.quantity_remaining || 0));
  } else if (filter === 'expired') {
    rows = rows.filter((row) => Number(row.quantity_remaining || 0) > 0 && new Date(row.expiry_date) < now);
    rows.sort((left, right) => new Date(right.expiry_date) - new Date(left.expiry_date));
  } else {
    rows.sort((left, right) => new Date(left.expiry_date) - new Date(right.expiry_date));
  }

  return cleanDocs(rows);
}

export async function getBillWithItems(shopId, billId) {
  const databaseHandle = await db();
  const bill = await databaseHandle.collection('bills').findOne({ id: toNumber(billId), shop_id: toNumber(shopId) });
  if (!bill) return null;

  const items = await databaseHandle.collection('bill_items').find({ bill_id: bill.id }).toArray();
  const medicineIds = [...new Set(items.map((item) => item.medicine_id))];
  const batchIds = [...new Set(items.map((item) => item.batch_id))];

  const [medicines, batches] = await Promise.all([
    medicineIds.length ? databaseHandle.collection('medicines').find({ id: { $in: medicineIds } }).toArray() : [],
    batchIds.length ? databaseHandle.collection('batches').find({ id: { $in: batchIds } }).toArray() : [],
  ]);

  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const batchMap = new Map(batches.map((batch) => [batch.id, batch]));

  return {
    bill: cleanDoc(bill),
    items: cleanDocs(items.map((item) => {
      const medicine = medicineMap.get(item.medicine_id) || {};
      const batch = batchMap.get(item.batch_id) || {};
      return {
        ...item,
        medicine_name: medicine.name || null,
        unit: medicine.unit || null,
        batch_no: batch.batch_no || null,
        expiry_date: batch.expiry_date || null,
      };
    })),
  };
}

export async function listBills(shopId, search = '') {
  const databaseHandle = await db();
  const bills = await databaseHandle.collection('bills')
    .find({ shop_id: toNumber(shopId) })
    .sort({ created_at: -1 })
    .limit(100)
    .toArray();

  if (!search) {
    return cleanDocs(bills);
  }

  const regex = new RegExp(escapeRegExp(search), 'i');
  return cleanDocs(bills.filter((bill) => regex.test(bill.bill_no || '') || regex.test(bill.customer_name || '') || regex.test(bill.customer_phone || '')));
}

export async function validateBatchStock(shopId, batchId) {
  const batches = await collection('batches');
  return cleanDoc(await batches.findOne({ id: toNumber(batchId), shop_id: toNumber(shopId) }, { projection: { quantity_remaining: 1 } }));
}

export async function createBillWithItems(shopId, billData, items, userId) {
  const databaseHandle = await db();
  const session = client.startSession();
  const total = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const discount = Number(billData.discount || 0);
  const net = money(total - discount);
  const billNo = `BILL-${Date.now()}`;

  try {
    session.startTransaction();

    const bills = databaseHandle.collection('bills');
    const billItems = databaseHandle.collection('bill_items');
    const batches = databaseHandle.collection('batches');
    const billId = await nextSequence('bills', session);

    await bills.insertOne({
      id: billId,
      shop_id: toNumber(shopId),
      bill_no: billNo,
      customer_name: billData.customerName || null,
      customer_phone: billData.customerPhone || null,
      total_amount: money(total),
      discount,
      net_amount: net,
      created_by: toNumber(userId),
      created_at: new Date(),
    }, { session });

    for (const item of items) {
      const batchId = toNumber(item.batchId);
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const subtotal = Number(item.subtotal || 0);

      const updateResult = await batches.updateOne(
        { id: batchId, shop_id: toNumber(shopId), quantity_remaining: { $gte: quantity } },
        { $inc: { quantity_remaining: -quantity } },
        { session },
      );

      if (!updateResult.matchedCount) {
        throw new Error(`Insufficient stock for batch #${batchId}`);
      }

      const billItemId = await nextSequence('bill_items', session);
      await billItems.insertOne({
        id: billItemId,
        bill_id: billId,
        batch_id: batchId,
        medicine_id: toNumber(item.medicineId),
        quantity,
        unit_price: unitPrice,
        subtotal,
      }, { session });
    }

    await session.commitTransaction();
    return { billId, billNo, net };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function getDashboardStats(shopId) {
  const databaseHandle = await db();
  const [bills, batches, medicines] = await Promise.all([
    databaseHandle.collection('bills').find({ shop_id: toNumber(shopId) }).toArray(),
    databaseHandle.collection('batches').find({ shop_id: toNumber(shopId) }).toArray(),
    databaseHandle.collection('medicines').find({ shop_id: toNumber(shopId) }).toArray(),
  ]);

  const now = new Date();
  const todayKey = utcDayKey(now);
  const monthKey = now.toISOString().slice(0, 7);
  const nearExpiryLimit = addUtcDays(now, 30);

  const todayRevenue = bills.filter((bill) => utcDayKey(bill.created_at) === todayKey).reduce((sum, bill) => sum + Number(bill.net_amount || 0), 0);
  const monthRevenue = bills.filter((bill) => new Date(bill.created_at).toISOString().slice(0, 7) === monthKey).reduce((sum, bill) => sum + Number(bill.net_amount || 0), 0);

  return {
    todayRevenue: money(todayRevenue),
    monthRevenue: money(monthRevenue),
    nearExpiryCount: batches.filter((batch) => Number(batch.quantity_remaining || 0) > 0 && isDateInRange(batch.expiry_date, now, nearExpiryLimit)).length,
    lowStockCount: [...new Set(batches.filter((batch) => Number(batch.quantity_remaining || 0) > 0 && Number(batch.quantity_remaining || 0) <= 10).map((batch) => batch.medicine_id))].length,
    outOfStockCount: medicines.filter((medicine) => !batches.some((batch) => batch.medicine_id === medicine.id && Number(batch.quantity_remaining || 0) > 0)).length,
    totalBills: bills.length,
  };
}

export async function getRevenueChart(shopId, days = 30) {
  const databaseHandle = await db();
  const bills = await databaseHandle.collection('bills').find({ shop_id: toNumber(shopId) }).toArray();
  const start = startOfUtcDay(addUtcDays(new Date(), -days));
  const summary = new Map();

  for (const bill of bills) {
    const createdAt = new Date(bill.created_at);
    if (createdAt < start) continue;
    const key = utcDayKey(createdAt);
    const current = summary.get(key) || { date: key, revenue: 0, bills: 0 };
    current.revenue += Number(bill.net_amount || 0);
    current.bills += 1;
    summary.set(key, current);
  }

  return [...summary.values()].sort((left, right) => left.date.localeCompare(right.date)).map((row) => ({
    date: row.date,
    revenue: money(row.revenue),
    bills: row.bills,
  }));
}

export async function getTopMedicines(shopId, limit = 10) {
  const databaseHandle = await db();
  const [bills, items, medicines] = await Promise.all([
    databaseHandle.collection('bills').find({ shop_id: toNumber(shopId) }).toArray(),
    databaseHandle.collection('bill_items').find({}).toArray(),
    databaseHandle.collection('medicines').find({ shop_id: toNumber(shopId) }).toArray(),
  ]);

  const billIds = new Set(bills.map((bill) => bill.id));
  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const summary = new Map();

  for (const item of items) {
    if (!billIds.has(item.bill_id)) continue;
    const medicine = medicineMap.get(item.medicine_id);
    if (!medicine) continue;

    const current = summary.get(item.medicine_id) || { name: medicine.name, sold: 0, revenue: 0 };
    current.sold += Number(item.quantity || 0);
    current.revenue += Number(item.subtotal || 0);
    summary.set(item.medicine_id, current);
  }

  return [...summary.values()]
    .sort((left, right) => right.sold - left.sold)
    .slice(0, limit)
    .map((row) => ({
      name: row.name,
      sold: row.sold,
      revenue: money(row.revenue),
    }));
}

export async function getNearExpiryBatches(shopId, days = 30) {
  const rows = await listBatches({ shopId: toNumber(shopId), filter: 'near_expiry', nearExpiryDays: days });
  return rows.filter((row) => isDateInRange(row.expiry_date, new Date(), addUtcDays(new Date(), days)));
}

export async function getExpiredBatchesWithLoss(shopId) {
  const rows = await listBatches({ shopId: toNumber(shopId), filter: 'expired' });
  return rows.map((row) => ({
    name: row.medicine_name,
    batch_no: row.batch_no,
    expiry_date: row.expiry_date,
    quantity_remaining: row.quantity_remaining,
    loss_value: money(row.loss_value || 0),
  }));
}

export async function getAdminStats() {
  const databaseHandle = await db();
  const [shops, bills] = await Promise.all([
    databaseHandle.collection('shops').find({}).toArray(),
    databaseHandle.collection('bills').find({}).toArray(),
  ]);

  return {
    totalShops: shops.length,
    pendingShops: shops.filter((shop) => shop.status === 'pending').length,
    approvedShops: shops.filter((shop) => shop.status === 'approved').length,
    platformRevenue: money(bills.reduce((sum, bill) => sum + Number(bill.net_amount || 0), 0)),
    totalBills: bills.length,
  };
}

export async function getAdminGrowthStats() {
  const databaseHandle = await db();
  const shops = await databaseHandle.collection('shops').find({}).toArray();
  const start = startOfUtcDay(addUtcDays(new Date(), -30));
  const summary = new Map();

  for (const shop of shops) {
    const createdAt = new Date(shop.created_at);
    if (createdAt < start) continue;
    const key = utcDayKey(createdAt);
    summary.set(key, (summary.get(key) || 0) + 1);
  }

  return [...summary.entries()].sort((left, right) => left[0].localeCompare(right[0])).map(([date, new_shops]) => ({ date, new_shops }));
}

export async function getAdminRevenueStats() {
  const databaseHandle = await db();
  const bills = await databaseHandle.collection('bills').find({}).toArray();
  const start = startOfUtcDay(addUtcDays(new Date(), -30));
  const summary = new Map();

  for (const bill of bills) {
    const createdAt = new Date(bill.created_at);
    if (createdAt < start) continue;
    const key = utcDayKey(createdAt);
    const current = summary.get(key) || { date: key, revenue: 0, bills: 0 };
    current.revenue += Number(bill.net_amount || 0);
    current.bills += 1;
    summary.set(key, current);
  }

  return [...summary.values()].sort((left, right) => left.date.localeCompare(right.date)).map((row) => ({
    date: row.date,
    revenue: money(row.revenue),
    bills: row.bills,
  }));
}

export async function getTopShops() {
  const databaseHandle = await db();
  const [shops, bills] = await Promise.all([
    databaseHandle.collection('shops').find({}).toArray(),
    databaseHandle.collection('bills').find({}).toArray(),
  ]);

  const summary = new Map();
  for (const bill of bills) {
    const current = summary.get(bill.shop_id) || { total_bills: 0, revenue: 0 };
    current.total_bills += 1;
    current.revenue += Number(bill.net_amount || 0);
    summary.set(bill.shop_id, current);
  }

  return shops.map((shop) => {
    const totals = summary.get(shop.id) || { total_bills: 0, revenue: 0 };
    return {
      name: shop.name,
      status: shop.status,
      total_bills: totals.total_bills,
      revenue: money(totals.revenue),
    };
  }).sort((left, right) => right.revenue - left.revenue).slice(0, 10);
}

export async function getInventoryValue(shopId) {
  const databaseHandle = await db();
  const [batches, medicines] = await Promise.all([
    databaseHandle.collection('batches').find({ shop_id: toNumber(shopId) }).toArray(),
    databaseHandle.collection('medicines').find({ shop_id: toNumber(shopId) }).toArray(),
  ]);

  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const summary = new Map();

  for (const batch of batches) {
    const remaining = Number(batch.quantity_remaining || 0);
    if (remaining <= 0) continue;
    const medicine = medicineMap.get(batch.medicine_id);
    if (!medicine) continue;

    const current = summary.get(batch.medicine_id) || {
      name: medicine.name,
      stock: 0,
      purchase_value: 0,
      sell_value: 0,
    };

    current.stock += remaining;
    current.purchase_value += remaining * Number(batch.purchase_price || 0);
    current.sell_value += remaining * Number(batch.selling_price || 0);
    summary.set(batch.medicine_id, current);
  }

  return [...summary.values()].sort((left, right) => right.sell_value - left.sell_value).map((row) => ({
    name: row.name,
    stock: row.stock,
    purchase_value: money(row.purchase_value),
    sell_value: money(row.sell_value),
  }));
}

export async function getDealerInsights(shopId) {
  const databaseHandle = await db();
  const [dealers, batches] = await Promise.all([
    databaseHandle.collection('dealers').find({ shop_id: toNumber(shopId) }).toArray(),
    databaseHandle.collection('batches').find({ shop_id: toNumber(shopId) }).toArray(),
  ]);

  const summary = new Map();
  for (const batch of batches) {
    if (!batch.dealer_id) continue;
    const current = summary.get(batch.dealer_id) || { batches: 0, total_supplied: 0 };
    current.batches += 1;
    current.total_supplied += Number(batch.quantity_total || 0);
    summary.set(batch.dealer_id, current);
  }

  return dealers.map((dealer) => {
    const totals = summary.get(dealer.id) || { batches: 0, total_supplied: 0 };
    return {
      name: dealer.name,
      batches: totals.batches,
      total_supplied: totals.total_supplied,
    };
  }).sort((left, right) => right.total_supplied - left.total_supplied);
}

export async function getRecentBills(shopId, limit = 20) {
  const bills = await collection('bills');
  const rows = await bills.find({ shop_id: toNumber(shopId) }).sort({ created_at: -1 }).limit(limit).toArray();
  return cleanDocs(rows.map((bill) => ({
    bill_no: bill.bill_no,
    customer_name: bill.customer_name,
    customer_phone: bill.customer_phone,
    net_amount: bill.net_amount,
    created_at: bill.created_at,
  })));
}

export async function getMedicineStockSummary(shopId, search = '') {
  const databaseHandle = await db();
  const query = { shop_id: toNumber(shopId) };

  if (search) {
    const regex = { $regex: escapeRegExp(search), $options: 'i' };
    query.$or = [{ name: regex }, { generic_name: regex }];
  }

  const [medicines, batches] = await Promise.all([
    databaseHandle.collection('medicines').find(query).sort({ name: 1 }).toArray(),
    databaseHandle.collection('batches').find({ shop_id: toNumber(shopId) }).toArray(),
  ]);

  const summary = new Map();
  const nowMs = new Date();
  for (const batch of batches) {
    const current = summary.get(batch.medicine_id) || { stock: 0, nearest_expiry: null };
    const remaining = Number(batch.quantity_remaining || 0);
    current.stock += remaining;
    if (remaining > 0) {
      const expiry = new Date(batch.expiry_date);
      // Only track nearest FUTURE expiry — skip already-expired batches.
      if (expiry > nowMs) {
        if (!current.nearest_expiry || expiry < new Date(current.nearest_expiry)) {
          current.nearest_expiry = expiry;
        }
      }
    }
    summary.set(batch.medicine_id, current);
  }

  return cleanDocs(medicines.map((medicine) => {
    const totals = summary.get(medicine.id) || { stock: 0, nearest_expiry: null };
    return {
      ...medicine,
      stock: totals.stock,
      nearest_expiry: totals.nearest_expiry,
    };
  }));
}

export async function getRevenueSummary(shopId) {
  const bills = await collection('bills');
  const rows = await bills.find({ shop_id: toNumber(shopId) }).toArray();
  const now = new Date();
  const todayKey = utcDayKey(now);
  const monthKey = now.toISOString().slice(0, 7);

  const today = rows.filter((bill) => utcDayKey(bill.created_at) === todayKey);
  const month = rows.filter((bill) => new Date(bill.created_at).toISOString().slice(0, 7) === monthKey);

  return {
    today_revenue: money(today.reduce((sum, bill) => sum + Number(bill.net_amount || 0), 0)),
    today_bills: today.length,
    month_revenue: money(month.reduce((sum, bill) => sum + Number(bill.net_amount || 0), 0)),
    month_bills: month.length,
  };
}

export async function setShopStatus(shopId, action, reason) {
  const shops = await collection('shops');
  if (action === 'approve') {
    await shops.updateOne({ id: toNumber(shopId) }, { $set: { status: 'approved', rejection_reason: null } });
    return;
  }

  if (action === 'reject') {
    await shops.updateOne({ id: toNumber(shopId) }, { $set: { status: 'rejected', rejection_reason: reason || 'Not approved' } });
    return;
  }

  throw new Error('Invalid action');
}

export async function recordAiQuery(shopId, userId, question, generatedQuery, resultSummary) {
  const databaseHandle = await db();
  const logs = databaseHandle.collection('ai_query_logs');
  const nextId = await nextSequence('ai_query_logs');

  await logs.insertOne({
    id: nextId,
    shop_id: toNumber(shopId),
    user_id: userId === null || userId === undefined ? null : toNumber(userId),
    question,
    generated_query: generatedQuery || null,
    result_summary: resultSummary || null,
    created_at: new Date(),
  });

  return nextId;
}

export async function runAiQuery(question, shopId) {
  const q = String(question || '').toLowerCase();
  const shop = toNumber(shopId);

  if (q.includes('expir') && (q.includes('next month') || q.includes('30 days') || q.includes('soon'))) {
    return {
      query: 'Atlas insight: near-expiry batches in 30 days',
      rows: await getNearExpiryBatches(shop, 30),
    };
  }

  if (q.includes('expir') && q.includes('60 days')) {
    return {
      query: 'Atlas insight: near-expiry batches in 60 days',
      rows: await getNearExpiryBatches(shop, 60),
    };
  }

  if (q.includes('expired') && !q.includes('expiring')) {
    return {
      query: 'Atlas insight: expired batches with loss',
      rows: await getExpiredBatchesWithLoss(shop),
    };
  }

  if (q.includes('out of stock') || q.includes('no stock')) {
    return {
      query: 'Atlas insight: out-of-stock medicines',
      rows: (await getMedicineStockSummary(shop)).filter((medicine) => Number(medicine.stock || 0) <= 0).map((medicine) => ({
        name: medicine.name,
        category: medicine.category || null,
      })),
    };
  }

  if (q.includes('low stock') || q.includes('running low')) {
    return {
      query: 'Atlas insight: low-stock medicines',
      rows: (await getMedicineStockSummary(shop)).filter((medicine) => Number(medicine.stock || 0) > 0 && Number(medicine.stock || 0) <= 10).map((medicine) => ({
        name: medicine.name,
        stock: medicine.stock,
      })),
    };
  }

  if ((q.includes('top') || q.includes('best')) && (q.includes('sell') || q.includes('medicine'))) {
    return {
      query: 'Atlas insight: top selling medicines',
      rows: await getTopMedicines(shop, 10),
    };
  }

  if (q.includes('revenue') && q.includes('today')) {
    return {
      query: 'Atlas insight: revenue today',
      rows: [await getRevenueSummary(shop)],
    };
  }

  if (q.includes('revenue') && q.includes('month')) {
    return {
      query: 'Atlas insight: revenue this month',
      rows: [await getRevenueSummary(shop)],
    };
  }

  if (q.includes('total stock') || q.includes('inventory value')) {
    return {
      query: 'Atlas insight: inventory value',
      rows: await getInventoryValue(shop),
    };
  }

  if (q.includes('dealer') || q.includes('supplier')) {
    return {
      query: 'Atlas insight: dealer performance',
      rows: await getDealerInsights(shop),
    };
  }

  if (q.includes('bill') && (q.includes('today') || q.includes('recent'))) {
    return {
      query: 'Atlas insight: recent bills',
      rows: await getRecentBills(shop, 20),
    };
  }

  const match = question.match(/(?:stock|quantity|how many).+?(?:of\s+)?(.+?)(?:\?|$)/i);
  if (match) {
    const medicineName = match[1].trim();
    return {
      query: 'Atlas insight: medicine stock lookup',
      rows: (await getMedicineStockSummary(shop, medicineName)).map((medicine) => ({
        name: medicine.name,
        stock: medicine.stock,
        nearest_expiry: medicine.nearest_expiry || null,
      })),
    };
  }

  return {
    query: 'Atlas insight: inventory snapshot',
    rows: (await getMedicineStockSummary(shop)).slice(0, 20).map((medicine) => ({
      name: medicine.name,
      stock: medicine.stock,
    })),
  };
}
