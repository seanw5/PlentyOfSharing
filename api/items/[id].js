import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid item id.' });

  const sql = neon(process.env.DATABASE_URL);
  await sql`DELETE FROM items WHERE id = ${id}`;
  return res.status(204).end();
}
