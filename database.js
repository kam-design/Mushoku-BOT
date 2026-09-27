const mongoose = require('mongoose');
const { BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');

async function connectDB(mongoURI) {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

const AuthSchema = new mongoose.Schema({
    _id: String,
    data: String
});
const AuthModel = mongoose.model('Auth', AuthSchema);

async function useMongoAuthState() {
    const readData = async (id) => {
        try {
            const doc = await AuthModel.findById(id);
            if (!doc) return null;
            return JSON.parse(doc.data, BufferJSON.reviver);
        } catch {
            return null;
        }
    };

    const writeData = async (id, data) => {
        const value = JSON.stringify(data, BufferJSON.replacer);
        await AuthModel.findByIdAndUpdate(id, { data: value }, { upsert: true });
    };

    const removeData = async (id) => {
        await AuthModel.findByIdAndDelete(id);
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
                            tasks.push(value ? writeData(key, value) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData('creds', creds)
    };
}

const playerSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: { type: String, default: 'Adventurer' },
    class: { type: String, default: 'None' },
    isRegistered: { type: Boolean, default: false },
    rank: { type: String, default: 'Novice' },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    maxExp: { type: Number, default: 100 },
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    mana: { type: Number, default: 100 },
    maxMana: { type: Number, default: 100 },
    stamina: { type: Number, default: 100 },
    maxStamina: { type: Number, default: 100 },
    gold: { type: Number, default: 50 },
    element: { type: String, default: 'None' },
    skills: [{ type: String }],
    
    // Inventory and Gear
    inventory: [{
        id: { type: String },
        qty: { type: Number, default: 1 }
    }],
    equippedWeapon: { type: String, default: null },

    // Active PvE Battle Tracking
    inCombat: { type: Boolean, default: false },
    enemy: {
        name: String,
        hp: Number,
        maxHp: Number,
        atk: Number,
        expReward: Number,
        goldReward: Number
    },

    // PvP State Tracking
    pvpState: {
        inPvp: { type: Boolean, default: false },
        opponentJid: { type: String, default: null },
        isTurn: { type: Boolean, default: false },
        pendingChallengeFrom: { type: String, default: null }
    },

    // Romance & Marriage Systems
    affection: { type: Map, of: Number, default: {} },
    spouse: { type: String, default: null },
    lastInteracted: { type: Map, of: Date, default: {} },

    createdAt: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

module.exports = { connectDB, useMongoAuthState, Player };