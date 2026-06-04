const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');
const checkRateLimit = require('./rate-limit-check');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    const { to, message, deviceId, token } = req.body;

    // ── 1. 토큰 검증 ──────────────────────────────────
    if (!deviceId || !token) {
        return res.status(401).json({ error: '인증 정보 없음' });
    }
    try {
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql`
            SELECT token FROM device_tokens
            WHERE device_id = ${deviceId}
        `;
        if (rows.length === 0 || rows[0].token !== token) {
            return res.status(403).json({ error: '유효하지 않은 토큰' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'DB 오류: ' + err.message });
    }

    // ── 2. Rate Limiting ───────────────────────────────
    try {
        const allowed = await checkRateLimit(deviceId);
        if (!allowed) {
            return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' });
        }
    } catch (err) {
        console.error('Rate limit 오류:', err.message);
        // Rate limit 오류 시 차단하지 않고 통과 (서비스 우선)
    }
    // ────────────────────────────────────────────────────

    const apiKey    = 'NCSM6LSQSH1TICTC';
    const apiSecret = '0IRIMBRIPAHVCHI1YA06YKL9WIGHTRUQ';
    const fromNum   = '01031469599';

    const date      = new Date().toISOString();
    const salt      = crypto.randomBytes(16).toString('hex');
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(date + salt)
        .digest('hex');

    const response = await fetch(
        'https://api.coolsms.co.kr/messages/v4/send',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
            },
            body: JSON.stringify({
                message: { to, from: fromNum, text: message }
            })
        }
    );

    const data = await response.json();
    res.status(200).json(data);
};
