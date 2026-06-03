const { RtcTokenBuilder, RtcRole } = require('agora-token');

const APP_ID          = 'fe2b8287b48348e59003f9c43b8402c9';
const APP_CERTIFICATE = 'f278e7b79cd34be4bea8cad5c82e6d64';

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const channel = req.query.channel;
    const uid     = parseInt(req.query.uid) || 0;
    if (!channel) return res.status(400).json({ error: 'channel required' });
    const expire = Math.floor(Date.now() / 1000) + 7200;
    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID, APP_CERTIFICATE,
        channel, uid,
        RtcRole.PUBLISHER, expire, expire
    );
    res.json({ token, channel, appId: APP_ID });
};
