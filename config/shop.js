export const SHOP_CATALOG = [
    // Consumables
    { id: 'potion_hp_minor', name: 'Minor Health Potion', cost: 25, type: 'consumable', effect: { hp: 50 }, desc: 'Restores 50 HP.' },
    { id: 'potion_hp_greater', name: 'Greater Health Potion', cost: 100, type: 'consumable', effect: { hp: 200 }, desc: 'Restores 200 HP.' },
    { id: 'elixir_mp', name: 'Mana Elixir', cost: 50, type: 'consumable', effect: { mp: 40 }, desc: 'Restores 40 MP.' },
    { id: 'elixir_mp_high', name: 'High Mana Elixir', cost: 200, type: 'consumable', effect: { mp: 150 }, desc: 'Restores 150 MP.' },

    // Beast Supplies
    { id: 'beast_feed_raw', name: 'Raw Beast Feed', cost: 20, type: 'beast_feed', effect: { beastHp: 40 }, desc: 'Restores 40 Beast HP.' },
    { id: 'beast_treat', name: 'Enchanted Beast Treat', cost: 120, type: 'beast_feed', effect: { beastHp: 150 }, desc: 'Restores 150 Beast HP.' },

    // Equipment
    { id: 'wand_oak', name: 'Oak Wand', cost: 150, type: 'equipment', classReq: 'Mage', desc: '+10 Spell Damage.' },
    { id: 'sword_iron', name: 'Iron Broadsword', cost: 150, type: 'equipment', classReq: 'Warrior', desc: '+12 Attack Damage.' },
    { id: 'claws_iron', name: 'Iron Fang Claws', cost: 300, type: 'equipment', classReq: 'Summoner', desc: '+15 Beast Attack Damage.' }
];