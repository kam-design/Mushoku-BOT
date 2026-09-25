import path from 'path';
import fs from 'fs';
import { Player } from '../models/Player.js';
import { getHelpMenu } from '../config/help.js';
import { getRandomSurname, getProgressBar } from '../utils/helpers.js';

export async function handleHelp(sock, jid) {
    const player = await Player.findOne({ jid });
    const helpText = getHelpMenu(player?.name, player?.state === 'REGISTERED');
    const imagePath = path.join(process.cwd(), 'Mushoku.jpg');

    if (fs.existsSync(imagePath)) {
        await sock.sendMessage(jid, { image: { url: imagePath }, caption: helpText });
    } else {
        await sock.sendMessage(jid, { text: helpText });
    }
}

export async function handleReincarnate(sock, jid, pushName) {
    let player = await Player.findOne({ jid });

    if (player) {
        await sock.sendMessage(jid, { text: `⚠️ You are already reborn in the Six-Face World as *${player.name}*!` });
        return;
    }

    const surname = getRandomSurname();
    const fullName = `${pushName}${surname}`;

    player = await Player.create({
        jid,
        name: fullName,
        hp: 100,
        maxHp: 100,
        mp: 100,
        maxMp: 100,
        coins: 50,
        skillPoints: 3,
        learnedSkills: [],
        state: 'AWAITING_CLASS'
    });

    const reincarnateText = 
`╔═════════════════════════╗
   ✨ *REINCARNATION NOTICE* ✨
╚═════════════════════════╝

🌀 *The Mana Calamity has transported you...*
You have been reborn in the **Six-Face World**.

👤 **New Identity:** \`${fullName}\`
📍 **Location:** Central Continent - Fittoa Region

─────────────────────────
⚔️ **Choose Your Destiny Path:**
─────────────────────────
📜 **#mage**     ─── *Master elements & silent chanting*
🛡️ **#warrior**  ─── *Hone Sword God / Water God styles*
🔮 **#summoner** ─── *Contract with spirits & beasts*

*Type one of the commands above to proceed.*`;

    await sock.sendMessage(jid, { text: reincarnateText });
}

export async function handleClassSelection(sock, jid, primaryCmd) {
    const player = await Player.findOne({ jid });

    if (!player) {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate first! Type *#reincarnate*.' });
        return;
    }

    if (player.state === 'REGISTERED') {
        await sock.sendMessage(jid, { text: `⚠️ You are already registered as a *${player.class}*!` });
        return;
    }

    const chosenClass = primaryCmd.slice(1).charAt(0).toUpperCase() + primaryCmd.slice(2).toLowerCase();

    player.class = chosenClass;
    player.state = 'REGISTERED';
    await player.save();

    const classText = 
`┌─────────────────────────┐
    📜 *GUILD CARD REGISTERED*
└─────────────────────────┘

👤 **Name:** ${player.name}
🎖️ **Class:** ${player.class}
🔰 **Rank:** ${player.rank || 'Beginner'}

┌─── 📊 *STATUS ATTRIBUTES* ───┐
│
├ 🔴 **HP:**  [${getProgressBar(player.hp, player.maxHp)}] ${player.hp}/${player.maxHp}
├ 🔵 **MP:**  [${getProgressBar(player.mp, player.maxMp)}] ${player.mp}/${player.maxMp}
├ 🪙 **Coins:** ${player.coins} Gold
├ 🌟 **Skill Points:** ${player.skillPoints} SP
│
└─────────────────────────┘

✨ *Your journey in the Six-Face World begins now!*
*Type #skills to view your class options, or #help for commands.*`;

    await sock.sendMessage(jid, { text: classText });
}

export async function handleProfile(sock, jid) {
    const player = await Player.findOne({ jid });

    if (!player) {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate first! Type *#reincarnate*.' });
        return;
    }

    const activePetText = player.activeSummon?.name ? `\n│ 🐾 Active Beast : ${player.activeSummon.name}` : '';

    const profileText = 
`=============================
    ⚜️ *ADVENTURER PROFILE* ⚜️
=============================

👤 **Adventurer:** ${player.name}
⚔️ **Class:** ${player.class}
📜 **Status:** ${player.state === 'REGISTERED' ? 'Active' : 'Unregistered'}
🎖️ **Level:** ${player.level || 1} | **EXP:** ${player.exp || 0}

┌── ⚔️ *COMBAT STATS* ─────┐
│ 🔴 **HP** : [${getProgressBar(player.hp, player.maxHp)}] ${player.hp}/${player.maxHp}
│ 🔵 **MP** : [${getProgressBar(player.mp, player.maxMp)}] ${player.mp}/${player.maxMp}
├── 🎒 *TREASURY & SKILLS* ──┤
│ 🪙 **Coins** : ${player.coins} Gold
│ 🌟 **Skill Points** : ${player.skillPoints} SP
│ 📜 **Unlocked** : ${player.learnedSkills.length > 0 ? player.learnedSkills.join(', ') : 'None'}${activePetText}
└─────────────────────────┘`;

    await sock.sendMessage(jid, { text: profileText });
}

export async function handleLeaderboard(sock, jid) {
    const topPlayers = await Player.find({ state: 'REGISTERED' })
        .sort({ level: -1, exp: -1 })
        .limit(10);

    if (!topPlayers.length) {
        await sock.sendMessage(jid, { text: '📜 No registered adventurers in the rankings yet!' });
        return;
    }

    let lbText = `╔═════════════════════════╗\n` +
                 `   🏆 *GREAT POWER RANKINGS* 🏆\n` +
                 `╚═════════════════════════╝\n\n`;

    topPlayers.forEach((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️';
        lbText += `${medal} *#${idx + 1} ${p.name || 'Adventurer'}*\n` +
                  `├ Class: ${p.class || 'None'} | Lvl: ${p.level || 1}\n` +
                  `└ Gold: ${p.coins || 0} | EXP: ${p.exp || 0}\n\n`;
    });

    await sock.sendMessage(jid, { text: lbText });
}