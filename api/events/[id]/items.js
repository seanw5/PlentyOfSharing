import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const eventId = Number(req.query.id);
  if (!Number.isInteger(eventId)) return res.status(400).json({ error: 'Invalid trip code.' });

  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const amountMills = Number(req.body?.amountMills);
  const payerId = Number(req.body?.payerId);
  const participantIds = Array.isArray(req.body?.participantIds)
    ? [...new Set(req.body.participantIds.map(Number))].filter(Number.isInteger)
    : [];

  if (!description) return res.status(400).json({ error: 'Description is required.' });
  if (!Number.isFinite(amountMills) || amountMills <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }
  if (!Number.isInteger(payerId)) return res.status(400).json({ error: 'Payer is required.' });
  if (participantIds.length === 0) return res.status(400).json({ error: 'At least one person must split this expense.' });

  const sql = neon(process.env.DATABASE_URL);

  const validParticipants = await sql`SELECT id FROM participants WHERE event_id = ${eventId}`;
  const validIds = new Set(validParticipants.map((p) => p.id));
  if (!validIds.has(payerId) || participantIds.some((id) => !validIds.has(id))) {
    return res.status(400).json({ error: 'One of the selected people is not part of this trip.' });
  }

  const itemRows = await sql`
    INSERT INTO items (event_id, description, amount_mills, payer_id)
    VALUES (${eventId}, ${description}, ${amountMills}, ${payerId})
    RETURNING id
  `;
  const itemId = itemRows[0].id;

  for (const participantId of participantIds) {
    await sql`INSERT INTO item_splits (item_id, participant_id) VALUES (${itemId}, ${participantId})`;
  }

  return res.status(201).json({ id: itemId });
}
