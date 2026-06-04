const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { userId, batteryLevel, type } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
        const sql = neon(process.env.DATABASE_URL);

        // 테이블 없으면 자동 생성
        await sql`
            CREATE TABLE IF NOT EXISTS battery_pings (
                id          SERIAL PRIMARY KEY,
                user_id     TEXT NOT NULL,
                battery     REAL,
                type        TEXT DEFAULT 'battery_dead',
                created_at  TIMESTAMPTZ DEFAULT NOW()
            )
        `;

        await sql`
            INSERT INTO battery_pings (user_id, battery, type)
            VALUES (${userId}, ${batteryLevel}, ${type || 'battery_dead'})
        `;

        res.json({ ok: true, message: 'ping saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
