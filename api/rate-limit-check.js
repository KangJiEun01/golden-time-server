const { neon } = require('@neondatabase/serverless');

// deviceId 기준으로 1분에 최대 3회 제한
module.exports = async function checkRateLimit(deviceId) {
    const sql = neon(process.env.DATABASE_URL);

    await sql`
        CREATE TABLE IF NOT EXISTS rate_limit_log (
            id         SERIAL PRIMARY KEY,
            device_id  TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    // 1분 안에 같은 기기가 보낸 요청 수 확인
    const rows = await sql`
        SELECT COUNT(*) as cnt FROM rate_limit_log
        WHERE device_id = ${deviceId}
        AND created_at > NOW() - INTERVAL '1 minute'
    `;

    const count = parseInt(rows[0].cnt);
    if (count >= 3) return false; // 차단

    // 기록 남기기
    await sql`
        INSERT INTO rate_limit_log (device_id) VALUES (${deviceId})
    `;

    // 오래된 로그 정리 (1시간 이상 지난 것)
    await sql`
        DELETE FROM rate_limit_log
        WHERE created_at < NOW() - INTERVAL '1 hour'
    `;

    return true; // 허용
};
