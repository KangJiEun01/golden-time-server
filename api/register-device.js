const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    try {
        const sql = neon(process.env.DATABASE_URL);

        // 테이블 없으면 자동 생성
        await sql`
            CREATE TABLE IF NOT EXISTS device_tokens (
                id          SERIAL PRIMARY KEY,
                device_id   TEXT NOT NULL UNIQUE,
                token       TEXT NOT NULL,
                created_at  TIMESTAMPTZ DEFAULT NOW()
            )
        `;

        // 이미 등록된 기기면 기존 토큰 반환
        const existing = await sql`
            SELECT token FROM device_tokens WHERE device_id = ${deviceId}
        `;
        if (existing.length > 0) {
            return res.json({ token: existing[0].token });
        }

        // 새 토큰 발급 (256비트 랜덤)
        const token = crypto.randomBytes(32).toString('hex');
        await sql`
            INSERT INTO device_tokens (device_id, token)
            VALUES (${deviceId}, ${token})
        `;

        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
