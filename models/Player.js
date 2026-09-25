import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: String,
    class: String,
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    mp: { type: Number, default: 50 },
    maxMp: { type: Number, default: 50 },
    coins: { type: Number, default: 50 },
    skillPoints: { type: Number, default: 3 },
    learnedSkills: [String],
    activeSummon: {
        name: { type: String, default: null },
        hp: { type: Number, default: 0 },
        maxHp: { type: Number, default: 0 }
    },
    inventory: [{ name: String, quantity: Number }],
    state: String,
    marriedTo: { type: String, default: null },
    marriedDate: { type: Date, default: null },
    affection: { type: Map, of: Number, default: {} },
    lastInteraction: {
        npc: String,
        time: Date,
        repeatCount: { type: Number, default: 0 }
    },
    // Combat State Machine Engine
    activeBattle: {
        inCombat: { type: Boolean, default: false },
        type: { type: String, enum: ['NONE', 'QUEST', 'PVP'], default: 'NONE' },
        targetJid: { type: String, default: null },
        monsterName: { type: String, default: null },
        enemyHp: { type: Number, default: 0 },
        enemyMaxHp: { type: Number, default: 0 },
        enemyDamage: { type: Number, default: 0 },
        turn: { type: String, default: null },
        pendingPvpFrom: { type: String, default: null }
    }
});

export const Player = mongoose.model('Player', playerSchema);