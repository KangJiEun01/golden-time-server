import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const sql = neon(process.env.DATABASE_URL!);

    const rows = await sql`
        SELECT lat, lng, updated_at FROM heartbeats WHERE user_id = ${userId as string}
    `;

    if (rows.length === 0) return res.status(404).json({ error: 'not found' });

    return res.status(200).json(rows[0]);
}
