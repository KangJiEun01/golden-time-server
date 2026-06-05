import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const keys = await kv.keys('heartbeat:*');
    const now = Date.now();
    const dead: string[] = [];

    for (const key of keys) {
        const last = await kv.get<number>(key);
        if (last && now - last > 10 * 60 * 1000) {
            dead.push(key.replace('heartbeat:', ''));
        }
    }

    return res.status(200).json({ dead, checked: keys.length });
}
