import type { VercelRequest, VercelResponse } from '@vercel/node';

const store: Record<string, number> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const now = Date.now();
    store[userId] = now;

    return res.status(200).json({ ok: true, timestamp: now });
}
