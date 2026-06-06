import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { userId, lat, lng } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const sql = neon(process.env.DATABASE_URL!);

    // 테이블 없으면 생성
    await sql`
        CREATE TABLE IF NOT EXISTS heartbeats (
            user_id TEXT PRIMARY KEY,
            lat DOUBLE PRECISION,
            lng DOUBLE PRECISION,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    // 위치 업데이트
    await sql`
        INSERT INTO heartbeats (user_id, lat, lng, updated_at)
        VALUES (${userId}, ${lat ?? null}, ${lng ?? null}, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET lat = ${lat ?? null}, lng = ${lng ?? null}, updated_at = NOW()
    `;

    return res.status(200).json({ ok: true });
}
