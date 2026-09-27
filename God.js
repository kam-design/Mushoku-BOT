module.exports = {
    GODS_DATABASE: [
        {
            id: 'technique',
            name: 'Technique God',
            title: '1st World Power',
            hp: 5000,
            atk: 350,
            expReward: 100000,
            goldReward: 5000000,
            desc: 'Master of all martial arts and magical constructs. Negates 20% incoming damage.'
        },
        {
            id: 'dragon',
            name: 'Dragon God',
            title: '2nd World Power (Orsted)',
            hp: 8000,
            atk: 500,
            expReward: 100000,
            goldReward: 5000000,
            desc: 'The supreme ancient dragon deity. Devastating physical force.'
        },
        {
            id: 'fighting',
            name: 'Fighting God',
            title: '3rd World Power (Badi Gadi)',
            hp: 10000,
            atk: 400,
            expReward: 100000,
            goldReward: 5000000,
            desc: 'Clad in golden armor. Possesses massive health and defense.'
        },
        {
            id: 'demon',
            name: 'Demon God',
            title: '4th World Power (Laplace)',
            hp: 7500,
            atk: 450,
            expReward: 100000,
            goldReward: 5000000,
            desc: 'Unrivaled mana capacity and chaotic elemental magic.'
        },
        {
            id: 'death',
            name: 'Death God',
            title: '5th World Power (Randolph)',
            hp: 6000,
            atk: 380,
            expReward: 100000,
            goldReward: 5000000,
            desc: 'Master of life-draining blades and illusions.'
        },
        {
            id: 'sword',
            name: 'Sword God',
            title: '6th World Power (Gal Farion)',
            hp: 5500,
            atk: 600,
            expReward: 100000,
            goldReward: 5000000,
            desc: 'Unmatched speed. Deals lethal critical strikes.'
        },
        {
            id: 'north',
            name: 'North God',
            title: '7th World Power (Kalman)',
            hp: 6500,
            atk: 420,
            expReward: 100000,
            goldReward: 5000000,
            desc: 'Tricky sword technique using trickery and heavy momentum.'
        }
    ],

    findGod: function (input) {
        if (!input) return null;
        const clean = input.toLowerCase().trim();
        return this.GODS_DATABASE.find(g => 
            g.id === clean || 
            g.name.toLowerCase() === clean || 
            g.name.toLowerCase().includes(clean)
        );
    }
};