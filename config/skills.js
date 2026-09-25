export const CLASS_SKILLS = {
    Mage: [
        { name: 'Water Ball', cost: 1, mpCost: 15, damage: 30, desc: 'Fires a concentrated sphere of water.' },
        { name: 'Fire Drip', cost: 1, mpCost: 15, damage: 35, desc: 'Ignites target with elemental flame.' },
        { name: 'Stone Cannon', cost: 2, mpCost: 35, damage: 70, desc: 'Launches a hardened earth projectile.' },
        { name: 'Cumulonimbus', cost: 3, mpCost: 70, damage: 150, desc: 'Saint-tier storm spell. Extreme damage.' }
    ],
    Warrior: [
        { name: 'Sword Strike', cost: 1, mpCost: 10, damage: 25, desc: 'Basic sword attack.' },
        { name: 'Water God Stance', cost: 1, mpCost: 20, damage: 40, desc: 'Counter-style defensive strike.' },
        { name: 'Longsword Light', cost: 2, mpCost: 40, damage: 80, desc: 'Sword God Style lightning-fast slash.' },
        { name: 'North God Decapitation', cost: 3, mpCost: 60, damage: 130, desc: 'Unpredictable heavy sword execution.' }
    ],
    Summoner: [
        { 
            name: 'Slime', 
            cost: 1, 
            mpCost: 20, 
            hp: 80,
            desc: 'A gooey acidic companion.',
            moves: [
                { name: 'Acid Spit', mpCost: 5, damage: 25, desc: 'Melts armor with corrosive goo.' },
                { name: 'Body Slam', mpCost: 10, damage: 35, desc: 'Launches its weight at the target.' }
            ]
        },
        { 
            name: 'Horned Rabbit', 
            cost: 1, 
            mpCost: 25, 
            hp: 100,
            desc: 'An agile beast with a sharp horn.',
            moves: [
                { name: 'Horn Thrust', mpCost: 10, damage: 40, desc: 'Swift piercing charge.' },
                { name: 'Gale Leap', mpCost: 15, damage: 50, desc: 'High-speed airborne strike.' }
            ]
        },
        { 
            name: 'Armored Hound', 
            cost: 2, 
            mpCost: 50, 
            hp: 200,
            desc: 'A high-defense frontline beast.',
            moves: [
                { name: 'Iron Jaw', mpCost: 15, damage: 65, desc: 'Crushes targets with heavy bite.' },
                { name: 'Intimidating Roar', mpCost: 20, damage: 30, desc: 'Stuns target and deals sonic damage.' }
            ]
        }
    ]
};