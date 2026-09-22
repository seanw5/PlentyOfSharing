import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const eventId = Number(req.query.id);
  if (!Number.isInteger(eventId)) return res.status(400).json({ error: 'Invalid trip code.' });

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (name.length > 40) return res.status(400).json({ error: 'Name is too long.' });

  const sql = neon(process.env.DATABASE_URL);
  const eventRows = await sql`SELECT id FROM events WHERE id = ${eventId}`;
  if (eventRows.length === 0) return res.status(404).json({ error: 'Trip not found.' });

  // Name-only "login": joining with a name that's already in this trip just re-joins as that person.
  const rows = await sql`
    INSERT INTO participants (event_id, name)
    VALUES (${eventId}, ${name})
    ON CONFLICT (event_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  `;
  return res.status(200).json(rows[0]);
}
