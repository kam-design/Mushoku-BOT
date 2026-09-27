const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const express = require('express');
const { connectDB, useMongoAuthState } = require('./database');
const { MONGO_URI } = require('./config');
const { handleCommand } = require('./commands');

if (!MONGO_URI) {
    console.error('❌ ERROR: MONGODB_URI is missing from your .env file!');
    process.exit(1);
}

// 1. Initialize Express app for Render & Cron Job pings
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send('Mushoku Tensei Bot is active!');
});

app.get('/ping', (req, res) => {
    res.status(200).send('Pong!');
});

app.listen(PORT, () => {
    console.log(`🌐 HTTP Keep-Alive server listening on port ${PORT}`);
});

// 2. Main WhatsApp Bot Initialization
async function startBot() {
    await connectDB(MONGO_URI);
    const { state, saveCreds } = await useMongoAuthState();

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Mushoku Tensei Bot online with Multi-file Architecture!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        await handleCommand(sock, msg);
    });
}

startBot();