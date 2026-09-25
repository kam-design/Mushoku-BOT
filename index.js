import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import makeWASocket, { 
    DisconnectReason, 
    BufferJSON, 
    initAuthCreds, 
    proto 
} from '@whiskeysockets/baileys';

// Configs
import { WAIFUS } from './config/waifus.js';

// Handlers
import { 
    handleHelp, 
    handleReincarnate, 
    handleClassSelection, 
    handleProfile,
    handleLeaderboard 
} from './handlers/playerHandler.js';

import { 
    handleSkillsList, 
    handleTame, 
    handleLearn 
} from './handlers/skillHandler.js';

import { 
    handleSummon, 
    handleBeastInfo, 
    handleAttack,
    handleQuest,
    handlePvp,
    handleAccept
} from './handlers/combatHandler.js';

import { 
    handleShop, 
    handleBuy, 
    handleInventory, 
    handleUse 
} from './handlers/shopHandler.js';

import { 
    handleWaifuList, 
    handleNpcInspect, 
    handleHello, 
    handlePropose, 
    handleWife 
} from './handlers/marriageHandler.js';

// ------------------------------------------------------------------
// 🌐 1. KEEP-ALIVE EXPRESS SERVER FOR CRON JOBS
// ------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🤖 Six-Face World RPG Bot is Live!'));
app.get('/ping', (req, res) => res.status(200).send('PONG'));

app.listen(PORT, () => console.log(`🌐 Ping server running on port ${PORT}`));

// ------------------------------------------------------------------
// 📦 2. MONGODB AUTH STATE (NO MORE RE-SCANNING ON RESTART/DEPLOY)
// ------------------------------------------------------------------
const sessionSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    data: { type: String, required: true }
});
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

async function useMongoDBAuthState() {
    const writeData = async (data, id) => {
        await Session.findByIdAndUpdate(
            id, 
            { data: JSON.stringify(data, BufferJSON.replacer) }, 
            { upsert: true }
        );
    };

    const readData = async (id) => {
        try {
            const doc = await Session.findById(id);
            if (!doc) return null;
            return JSON.parse(doc.data, BufferJSON.reviver);
        } catch {
            return null;
        }
    };

    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(value, key) : Session.findByIdAndDelete(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

// ------------------------------------------------------------------
// 🚀 3. BOT INITIALIZATION & EVENT LOOP
// ------------------------------------------------------------------
async function initDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    }
}

async function startBot() {
    await initDatabase();

    const { state, saveCreds } = await useMongoDBAuthState();
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // Initial pairing code request if not registered yet
    if (!sock.authState.creds.registered && process.env.PAIRING_NUMBER) {
        setTimeout(async () => {
            try {
                const rawPhone = process.env.PAIRING_NUMBER.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(rawPhone);
                console.log(`\n====================================`);
                console.log(`🔑 INITIAL PAIRING CODE: ${code}`);
                console.log(`====================================\n`);
            } catch (err) {
                console.error('❌ Failed to request initial pairing code:', err);
            }
        }, 4000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !process.env.PAIRING_NUMBER) {
            console.log('\nScan this QR code with WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚡ Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🤖 Six-Face World RPG Bot is online!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (msg.key.fromMe) continue;

            const jid = msg.key.remoteJid;
            const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
            const pushName = msg.pushName || 'Adventurer';

            if (!text.startsWith('#')) continue;
            console.log(`📩 [${jid}]: ${text}`);

            const commandArgs = text.split(/\s+/);
            const primaryCmd = commandArgs[0].toLowerCase();
            const cleanCmd = primaryCmd.replace('#', '').toLowerCase();

            // 1. Dynamic NPC trigger
            if (WAIFUS[cleanCmd]) {
                await handleNpcInspect(sock, jid, cleanCmd);
                continue;
            }

            // 2. Command Router
            switch (primaryCmd) {
                // System & Admin Commands
                case '#request':
                    const AUTHORIZED_GROUP = '120363409806719412@g.us';
                    if (jid !== AUTHORIZED_GROUP) {
                        await sock.sendMessage(jid, { text: '❌ This command is restricted to the admin group!' });
                        break;
                    }

                    const rawPhone = commandArgs[1]?.replace(/[^0-9]/g, '');
                    if (!rawPhone) {
                        await sock.sendMessage(jid, { text: '❌ Usage: `#request <PhoneNumber>`\nExample: `#request 263771234567`' });
                        break;
                    }

                    try {
                        const pairingCode = await sock.requestPairingCode(rawPhone);
                        await sock.sendMessage(jid, {
                            text: `🔑 *PAIRING CODE GENERATED*\n\n📱 **Phone:** +${rawPhone}\n🔢 **Code:** *${pairingCode}*\n\n_Enter this code in WhatsApp -> Linked Devices within 2 minutes._`
                        });
                    } catch (err) {
                        await sock.sendMessage(jid, { text: `❌ Failed to request pairing code: ${err.message}` });
                    }
                    break;

                case '#help':
                case '#bot':
                case '#cmd':
                    await handleHelp(sock, jid);
                    break;

                // Player & Progression
                case '#reincarnate':
                    await handleReincarnate(sock, jid, pushName);
                    break;

                case '#mage':
                case '#warrior':
                case '#summoner':
                    await handleClassSelection(sock, jid, primaryCmd);
                    break;

                case '#profile':
                case '#stats':
                    await handleProfile(sock, jid);
                    break;

                case '#lb':
                case '#top':
                case '#leaderboard':
                    await handleLeaderboard(sock, jid);
                    break;

                // Skills & Contracts
                case '#skills':
                case '#skill':
                    await handleSkillsList(sock, jid);
                    break;

                case '#learn':
                    await handleLearn(sock, jid, commandArgs);
                    break;

                case '#tame':
                    await handleTame(sock, jid, commandArgs);
                    break;

                // Combat, Quests & Summons
                case '#quest':
                    await handleQuest(sock, jid);
                    break;

                case '#pvp':
                    await handlePvp(sock, jid, msg);
                    break;

                case '#accept':
                    await handleAccept(sock, jid);
                    break;

                case '#summon':
                    await handleSummon(sock, jid, commandArgs);
                    break;

                case '#beast':
                case '#command':
                    await handleBeastInfo(sock, jid);
                    break;

                case '#attack':
                    await handleAttack(sock, jid, commandArgs);
                    break;

                // Market & Inventory
                case '#shop':
                    await handleShop(sock, jid);
                    break;

                case '#buy':
                    await handleBuy(sock, jid, commandArgs);
                    break;

                case '#inv':
                case '#inventory':
                    await handleInventory(sock, jid);
                    break;

                case '#use':
                    await handleUse(sock, jid, commandArgs);
                    break;

                // Maidens & Marriage
                case '#waifu':
                case '#maidens':
                    await handleWaifuList(sock, jid);
                    break;

                case '#hello':
                    await handleHello(sock, jid, commandArgs);
                    break;

                case '#propose':
                    await handlePropose(sock, jid, commandArgs);
                    break;

                case '#wife':
                    await handleWife(sock, jid);
                    break;

                default:
                    break;
            }
        }
    });
}

startBot();