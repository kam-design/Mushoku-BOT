export function getHelpMenu(playerName, isRegistered) {
    return `╔═══════════════════════════════╗
   📜 *SIX-FACE WORLD COMMANDS* 📜
╚═══════════════════════════════╝

👤 *Adventurer:* ${playerName || 'Unregistered'}

┌── 🔰 *BASIC & RANKINGS* ─────────┐
│
├ 🌀 *#reincarnate* ── Reborn in the world
├ 📊 *#profile*     ── View stats & level
├ 🏆 *#lb* | *#top* ── Power rankings
├ ❓ *#help*        ── Show this menu
│
├── ⚔️ *CLASS & SKILLS* ──────────┤
│
├ 🛡️ *#mage* | *#warrior* | *#summoner*
│  └─ Choose your class path
├ 📖 *#skills*      ── View skills / beasts
├ ✍️ *#learn <Skill>* ── Learn skill with SP
├ 🐾 *#tame <Beast>*  ── Contract beast (Summoner)
│
├── 💥 *COMBAT, QUESTS & PVP* ─────┤
│
├ 📜 *#quest*       ── Fight a scaled monster
├ ⚔️ *#pvp <@user>* ── Challenge player to a duel
├ ✅ *#accept*      ── Accept a PvP duel
├ 🔮 *#summon <Beast>* ── Summon beast into battle
├ 🐾 *#beast*       ── Inspect active beast stats
├ 💥 *#attack <Move>*  ── Cast skill or order beast
│
├── 🌸 *MAIDENS & MARRIAGE* ──────┤
│
├ 🌸 *#waifu*       ── List available maidens
├ 💬 *#hello <name>*── Interact with maiden
├ 💍 *#propose <name>*── Marry with Dragon Scale
├ ❤️ *#wife*        ── View wife stats & bonus
│
└── 🛒 *MARKET & INVENTORY* ──────┘
│
├ 🛒 *#shop*        ── Browse market items
├ 🛍️ *#buy <item>*  ── Buy item with Gold
├ 🎒 *#inv*         ── View your inventory
├ 🧪 *#use <item>*  ── Consume item / feed beast
└─────────────────────────────────┘`;
}