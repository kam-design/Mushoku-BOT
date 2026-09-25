import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    class: { type: String, enum: ['Mage', 'Warrior', 'Summoner', 'None'], default: 'None' },
    state: { type: String, enum: ['AWAITING_CLASS', 'REGISTERED'], default: 'AWAITING_CLASS' },
    
    // Stats & Progression
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    rank: { type: String, default: 'Beginner' },
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    mp: { type: Number, default: 100 },
    maxMp: { type: Number, default: 100 },
    
    // Economy & Assets
    coins: { type: Number, default: 50 },
    skillPoints: { type: Number, default: 3 },
    learnedSkills: [{ type: String }],
    
    // Inventory: [{ name: "Minor Health Potion", quantity: 2 }]
    inventory: [{
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 }
    }],
    
    // Active Summon Data
    activeSummon: {
        name: { type: String, default: null },
        hp: { type: Number, default: 0 },
        maxHp: { type: Number, default: 0 }
    }
});

export const Player = mongoose.model('Player', playerSchema);