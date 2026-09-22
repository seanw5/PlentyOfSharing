import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'Trip name is required.' });
  if (name.length > 80) return res.status(400).json({ error: 'Trip name is too long.' });

  const rows = await sql`INSERT INTO events (name) VALUES (${name}) RETURNING id, name, created_at`;
  return res.status(201).json(rows[0]);
}
