import crypto from 'crypto';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    const { to, message } = req.body;

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
}
