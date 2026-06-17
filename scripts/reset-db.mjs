/**
 * One-time DB reset script.
 * Clears medicines, batches, dealers, bills, bill_items, and counters
 * (the collections corrupted by the id=1 bug).
 * Shops and users are preserved so you don't lose login access.
 *
 * Usage:  node scripts/reset-db.mjs
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local manually (no dotenv needed)
const envPath = resolve(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const MONGODB_URI = env.MONGODB_URI;
const MONGODB_DB  = env.MONGODB_DB || 'stockeasy';

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not found in .env.local');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

const COLLECTIONS_TO_CLEAR = [
  'medicines',
  'batches',
  'dealers',
  'bills',
  'bill_items',
  'ai_query_logs',
  'counters',   // reset all auto-increment counters
];

try {
  await client.connect();
  const db = client.db(MONGODB_DB);

  for (const col of COLLECTIONS_TO_CLEAR) {
    const result = await db.collection(col).deleteMany({});
    console.log(`✓  Cleared "${col}"  (${result.deletedCount} docs removed)`);
  }

  console.log('\n✅  Done! All shop data cleared. Shops and user accounts are untouched.');
  console.log('   Restart the dev server and add your medicines/dealers fresh.\n');
} catch (err) {
  console.error('❌  Error:', err.message);
} finally {
  await client.close();
}
