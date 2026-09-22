import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid trip code.' });

  const sql = neon(process.env.DATABASE_URL);
  const eventRows = await sql`SELECT id, name, created_at FROM events WHERE id = ${id}`;
  if (eventRows.length === 0) return res.status(404).json({ error: 'Trip not found.' });

  const participants = await sql`
    SELECT id, name FROM participants WHERE event_id = ${id} ORDER BY id
  `;
  const items = await sql`
    SELECT id, description, amount_mills, payer_id, created_at
    FROM items WHERE event_id = ${id} ORDER BY id
  `;
  const splits = await sql`
    SELECT item_splits.item_id, item_splits.participant_id
    FROM item_splits
    JOIN items ON items.id = item_splits.item_id
    WHERE items.event_id = ${id}
  `;

  const splitsByItem = {};
  for (const s of splits) {
    (splitsByItem[s.item_id] ||= []).push(s.participant_id);
  }
  const itemsWithSplits = items.map((it) => ({
    id: it.id,
    description: it.description,
    amountMills: Number(it.amount_mills),
    payerId: it.payer_id,
    participantIds: splitsByItem[it.id] || []
  }));

  return res.status(200).json({
    event: eventRows[0],
    participants,
    items: itemsWithSplits
  });
}
