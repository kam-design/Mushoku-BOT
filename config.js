require('dotenv').config();

module.exports = {
    MONGO_URI: process.env.MONGODB_URI,
    SUPREME_ADMINS: [
        '120363409806719412@g.us'
    ],
    MAX_ACTIVE_MOVES: 4, // Max skill slots equipped at once
    SKILL_DATABASE: {
        Mage: {
            Water: [
                { id: 'heal', name: 'Heal', cost: 10, expCost: 0, dmg: -40, desc: 'Basic Healing Magic (Restores HP for 10 MP)' },
                { id: 'wball', name: 'Water Ball', cost: 30, expCost: 150, dmg: 35, desc: 'Fires a pressurized sphere of water' },
                { id: 'icart', name: 'Ice Lance', cost: 60, expCost: 400, dmg: 75, desc: 'Sharp ice projectile dealing piercing damage' }
            ],
            Earth: [
                { id: 'heal', name: 'Heal', cost: 10, expCost: 0, dmg: -40, desc: 'Basic Healing Magic (Restores HP for 10 MP)' },
                { id: 'eclod', name: 'Earth Bullet', cost: 30, expCost: 150, dmg: 35, desc: 'Launches hardened earth projectiles' },
                { id: 'ewall', name: 'Earth Wall', cost: 50, expCost: 350, dmg: 65, desc: 'Raises a solid stone barrier' }
            ],
            Wind: [
                { id: 'heal', name: 'Heal', cost: 10, expCost: 0, dmg: -40, desc: 'Basic Healing Magic (Restores HP for 10 MP)' },
                { id: 'wblade', name: 'Wind Blade', cost: 35, expCost: 200, dmg: 40, desc: 'Sharp vacuum blade of compressed air' },
                { id: 'gblast', name: 'Gale Blast', cost: 65, expCost: 500, dmg: 80, desc: 'Knocks enemies back with gust force' }
            ],
            Fire: [
                { id: 'heal', name: 'Heal', cost: 10, expCost: 0, dmg: -40, desc: 'Basic Healing Magic (Restores HP for 10 MP)' },
                { id: 'fball', name: 'Fireball', cost: 35, expCost: 200, dmg: 45, desc: 'Launches an exploding sphere of fire' },
                { id: 'fpillar', name: 'Fire Pillar', cost: 70, expCost: 600, dmg: 85, desc: 'Erupts a column of fire under targets' }
            ]
        },
        Warrior: {
            Water: [
                { id: 'wslash', name: 'Flowing Slash', cost: 25, expCost: 100, dmg: 40, desc: 'Water-God style counter attack' },
                { id: 'wparry', name: 'Water Mirror', cost: 50, expCost: 350, dmg: 70, desc: 'Heavy counter-strike' }
            ],
            Earth: [
                { id: 'estrike', name: 'Heavy Impact', cost: 25, expCost: 100, dmg: 40, desc: 'Earth-infused heavy slash' },
                { id: 'eguard', name: 'Stone Stance', cost: 45, expCost: 300, dmg: 65, desc: 'Defense-breaking heavy blow' }
            ],
            Wind: [
                { id: 'lflash', name: 'Light Flash', cost: 30, expCost: 200, dmg: 50, desc: 'Sword-God style fast slash' },
                { id: 'wstep', name: 'Gale Step', cost: 40, expCost: 450, dmg: 75, desc: 'Dashing armor-piercing strike' }
            ],
            Fire: [
                { id: 'fslash', name: 'Flame Strike', cost: 30, expCost: 200, dmg: 45, desc: 'Fire-coated blade cut' },
                { id: 'fcleave', name: 'Blaze Cleave', cost: 60, expCost: 500, dmg: 85, desc: 'Explosive heavy area attack' }
            ]
        }
    },
    SHOP_ITEMS: [
        {
            id: 'hppot',
            name: 'Elixir of Phoenix Life',
            type: 'potion',
            stat: 'hp',
            value: 100,
            price: 50,
            desc: 'Restores 100 HP instantly.'
        },
        {
            id: 'mppot',
            name: 'Mana Stream Elixir',
            type: 'potion',
            stat: 'mp',
            value: 150,
            price: 50,
            desc: 'Restores 150 MP instantly.'
        },
        {
            id: 'ibsword',
            name: 'Iron Broadsword',
            type: 'weapon',
            classReq: 'Warrior',
            dmgBoost: 0.20, // 20% Boost to skills
            price: 300,
            desc: 'Warrior weapon. Grants a +20% damage boost to skills.'
        },
        {
            id: 'dragon_scale',
            name: 'Dragon Scale',
            type: 'ring',
            price: 1000,
            desc: 'A rare legendary relic required to propose marriage.'
        }
    ],
    MAIDENS: [
        { id: 'elinalise', name: 'Elinalise', image: 'Elinalise.png', perk: '+15% Gold from Quests' },
        { id: 'lila', name: 'Lila', image: 'Lila.png', perk: '+10% EXP Gain' },
        { id: 'linia', name: 'Linia', image: 'Linia.png', perk: '+20 Max SP' },
        { id: 'nanahoshi', name: 'Nanahoshi', image: 'Nanahoshi.png', perk: '+20 Max MP' },
        { id: 'nina', name: 'Nina', image: 'Nina.png', perk: '+5% Skill DMG' },
        { id: 'roxy', name: 'Roxy', image: 'Roxy.png', perk: '+50 Max MP & Free MP Regeneration' },
        { id: 'sara', name: 'Sara', image: 'Sara.png', perk: '+10% Critical Chance' },
        { id: 'suzanne', name: 'Suzanne', image: 'Suzanne.png', perk: '+50 Max HP' },
        { id: 'sylphiette', name: 'Sylphiette', image: 'Sylphiette.png', perk: '+30 Max HP & +30 Max MP' },
        { id: 'zenith', name: 'Zenith', image: 'Zenith.png', perk: 'Restores 10 HP after every battle' }
    ],
    MONSTER_POOL: [
        { name: 'Red Smog Goblin', hpMult: 40, atkMult: 8, expMult: 35, goldMult: 20 },
        { name: 'Forest Treant', hpMult: 55, atkMult: 10, expMult: 45, goldMult: 25 },
        { name: 'Crawl Demon Cobra', hpMult: 45, atkMult: 12, expMult: 50, goldMult: 30 },
        { name: 'Demon Continent Pack Wolf', hpMult: 35, atkMult: 14, expMult: 55, goldMult: 35 },
        { name: 'Stray Armored Ogre', hpMult: 75, atkMult: 18, expMult: 80, goldMult: 50 }
    ],
    RANKS: ['Novice', 'Intermediate', 'Advanced', 'Saint', 'King', 'Emperor', 'God'],
    
    getMaxExpForLevel: (level) => {
        return 100 * Math.pow(2, level - 1);
    },
    
    getPlayerLevelBonus: (level) => {
        return Math.floor(level / 5) * 15;
    },

    getRandomElement: () => {
        return ['Water', 'Earth', 'Wind', 'Fire'][Math.floor(Math.random() * 4)];
    },

    createProgressBar: (current, max, size = 10) => {
        const percentage = Math.max(0, Math.min(1, current / max));
        const filled = Math.round(size * percentage);
        const empty = size - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round(percentage * 100)}%`;
    }
};