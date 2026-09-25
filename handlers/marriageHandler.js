import fs from 'fs';
import path from 'path';
import { Player } from '../models/Player.js';
import { WAIFUS } from '../config/waifus.js';

// ------------------------------------------------------------------
// 🌸 LIST ALL MAIDENS
// ------------------------------------------------------------------
export async function handleWaifuList(sock, jid) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate first using `#reincarnate`!' });
        return;
    }

    let listText = `╔═════════════════════════╗\n   🌸 *SIX-FACE WORLD MAIDENS* 🌸\n╚═════════════════════════╝\n\n`;

    Object.keys(WAIFUS).forEach(key => {
        const npc = WAIFUS[key];
        const affection = player.affection?.get(key) || 0;
        const isWife = player.marriedTo?.toLowerCase() === npc.name.toLowerCase();
        const statusTag = isWife ? '💍 *[WIFE]*' : `❤️ Affection: ${affection}/100`;

        listText += `💃 *${npc.name}* (${npc.title})\n` +
                    `├ ${statusTag}\n` +
                    `└ 💡 Command: '#hello ${key}' or '#${key}'\n\n`;
    });

    listText += `───────────────\n` +
                `🐉 *To Propose:* Reach 100 Affection & have a Dragon Scale in inventory!\n` +
                `💍 *Command:* '#propose <npc name>'`;

    const mainWaifuImagePath = path.join(process.cwd(), 'waifu.jpg');

    if (fs.existsSync(mainWaifuImagePath)) {
        await sock.sendMessage(jid, {
            image: { url: mainWaifuImagePath },
            caption: listText
        });
    } else {
        await sock.sendMessage(jid, { text: listText });
    }
}

// ------------------------------------------------------------------
// 🔍 DYNAMIC NPC INSPECTION (e.g. #roxy, #sylphiette)
// ------------------------------------------------------------------
export async function handleNpcInspect(sock, jid, npcKey) {
    const player = await Player.findOne({ jid });
    if (!player || player.state !== 'REGISTERED') return;

    const npc = WAIFUS[npcKey];
    if (!npc) return;

    const affection = player.affection?.get(npcKey) || 0;
    const isWife = player.marriedTo?.toLowerCase() === npc.name.toLowerCase();

    const text = `✨ *MAIDEN PROFILE: ${npc.name.toUpperCase()}* ✨\n\n` +
                 `📜 *Title:* ${npc.title}\n` +
                 `❤️ *Affection Level:* ${affection}/100\n` +
                 `💍 *Status:* ${isWife ? 'Married to You' : 'Single'}\n\n` +
                 `👉 Type '#hello ${npcKey}' to converse and build affection!`;

    // Resolves to process.cwd()/NPC/<ImageFileName.png>
    const imageFileName = npc.image || `${npcKey}.png`;
    const npcImagePath = path.join(process.cwd(), 'NPC', imageFileName);

    if (fs.existsSync(npcImagePath)) {
        await sock.sendMessage(jid, { image: { url: npcImagePath }, caption: text });
    } else {
        await sock.sendMessage(jid, { text });
    }
}

// ------------------------------------------------------------------
// 💬 INTERACT / SAY HELLO
// ------------------------------------------------------------------
export async function handleHello(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ Reincarnate first using `#reincarnate`!' });
        return;
    }

    const npcKey = commandArgs[1]?.toLowerCase();
    if (!npcKey || !WAIFUS[npcKey]) {
        await sock.sendMessage(jid, { text: '❌ Please specify a valid maiden name! Example: `#hello roxy`' });
        return;
    }

    const npc = WAIFUS[npcKey];
    
    if (!player.affection) player.affection = new Map();

    const currentAffection = player.affection.get(npcKey) || 0;

    if (currentAffection >= 100) {
        await sock.sendMessage(jid, {
            text: `💬 **${npc.name}:** "We already share the deepest bond possible, ${player.name}! You can propose to me with '#propose ${npcKey}' if you have a Dragon Scale!"`
        });
        return;
    }

    const gain = Math.floor(Math.random() * 6) + 5;
    const newAffection = Math.min(100, currentAffection + gain);
    
    player.affection.set(npcKey, newAffection);
    await player.save();

    const dialogList = npc.dialogues || npc.dialogs;
    const dialog = dialogList ? dialogList[Math.floor(Math.random() * dialogList.length)] : `"Hello, ${player.name}! Nice to see you today."`;

    await sock.sendMessage(jid, {
        text: `💬 **${npc.name}:** ${dialog}\n\n` +
              `❤️ *Affection Increased:* +${gain} (Current: ${newAffection}/100)`
    });
}

// ------------------------------------------------------------------
// 💍 PROPOSE MARRIAGE
// ------------------------------------------------------------------
export async function handlePropose(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ Reincarnate first using `#reincarnate`!' });
        return;
    }

    if (player.marriedTo) {
        await sock.sendMessage(jid, { text: `❌ You are already married to *${player.marriedTo}*!` });
        return;
    }

    const npcKey = commandArgs[1]?.toLowerCase();
    if (!npcKey || !WAIFUS[npcKey]) {
        await sock.sendMessage(jid, { text: '❌ Specify who you want to propose to! Example: `#propose roxy`' });
        return;
    }

    const npc = WAIFUS[npcKey];
    const affection = player.affection?.get(npcKey) || 0;

    if (affection < 100) {
        await sock.sendMessage(jid, {
            text: `❌ **${npc.name}** doesn't trust you enough yet!\n❤️ Required Affection: 100/100 (Current: ${affection}/100)`
        });
        return;
    }

    const scaleIndex = player.inventory.findIndex(i => i.name.toLowerCase() === 'dragon scale');
    if (scaleIndex === -1 || player.inventory[scaleIndex].quantity < 1) {
        await sock.sendMessage(jid, {
            text: "❌ You need a **Dragon Scale** to present as an engagement gift!\n🛒 Buy one from the '#shop' or slay dragons in quests."
        });
        return;
    }

    if (player.inventory[scaleIndex].quantity > 1) {
        player.inventory[scaleIndex].quantity -= 1;
    } else {
        player.inventory.splice(scaleIndex, 1);
    }

    player.marriedTo = npc.name;
    player.marriedDate = new Date();
    await player.save();

    await sock.sendMessage(jid, {
        text: `🎉 *MARRIAGE CEREMONY COMPLETE!* 🎉\n\n` +
              `💍 You offered the Dragon Scale and proposed to **${npc.name}**!\n` +
              `✨ She accepted your proposal!\n\n` +
              `💖 You are now officially married to **${npc.name}**!\n` +
              `👉 Use '#wife' to view your spouse benefits.`
    });
}

// ------------------------------------------------------------------
// ❤️ WIFE STATS & STATUS
// ------------------------------------------------------------------
export async function handleWife(sock, jid) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') return;

    if (!player.marriedTo) {
        await sock.sendMessage(jid, {
            text: "❌ You are not married yet! Build 100 Affection with a maiden using '#hello' and propose with a Dragon Scale."
        });
        return;
    }

    const marriageDateFormatted = player.marriedDate 
        ? new Date(player.marriedDate).toLocaleDateString() 
        : 'Unknown';

    await sock.sendMessage(jid, {
        text: `💖 *MARRIAGE STATUS* 💖\n\n` +
              `💍 **Spouse:** ${player.marriedTo}\n` +
              `📅 **Wedded On:** ${marriageDateFormatted}\n` +
              `✨ **Marital Passive:** +10% EXP Gain & +15% Gold Rewards in Combat!`
    });
}