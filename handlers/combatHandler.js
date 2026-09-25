import { Player } from '../models/Player.js';
import { CLASS_SKILLS } from '../config/skills.js';
import { getProgressBar } from '../utils/helpers.js';

// Random Monster Pool Generator
const MONSTERS = [
    { name: 'Goblin Scout', baseHp: 60, baseDmg: 12 },
    { name: 'Forest Wolf', baseHp: 90, baseDmg: 18 },
    { name: 'Treant Guardian', baseHp: 140, baseDmg: 22 },
    { name: 'Ogre Warrior', baseHp: 200, baseDmg: 30 },
    { name: 'Red Wyvern', baseHp: 320, baseDmg: 45 }
];

// Reset player combat state
function clearCombatState(player) {
    player.activeBattle = {
        inCombat: false,
        type: 'NONE',
        targetJid: null,
        monsterName: null,
        enemyHp: 0,
        enemyMaxHp: 0,
        enemyDamage: 0,
        turn: null,
        pendingPvpFrom: null
    };
}

// ------------------------------------------------------------------
// 📜 QUEST SYSTEM
// ------------------------------------------------------------------
export async function handleQuest(sock, jid) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ Reincarnate first using `#reincarnate`!' });
        return;
    }

    if (player.activeBattle?.inCombat) {
        await sock.sendMessage(jid, { text: '❌ You are already in combat! Finish your current battle first.' });
        return;
    }

    // Pick random monster scaling with player level
    const template = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    const scaleFactor = Math.max(1, player.level || 1);
    const enemyHp = Math.round(template.baseHp * (1 + (scaleFactor - 1) * 0.3));
    const enemyDamage = Math.round(template.baseDmg * (1 + (scaleFactor - 1) * 0.25));

    player.activeBattle = {
        inCombat: true,
        type: 'QUEST',
        targetJid: null,
        monsterName: template.name,
        enemyHp: enemyHp,
        enemyMaxHp: enemyHp,
        enemyDamage: enemyDamage,
        turn: jid,
        pendingPvpFrom: null
    };

    await player.save();

    await sock.sendMessage(jid, {
        text: `⚔️ *QUEST ASSIGNED!* ⚔️\n\n` +
              `👾 **A wild ${template.name} appeared!**\n` +
              `❤️ Monster HP: [${getProgressBar(enemyHp, enemyHp)}] ${enemyHp}/${enemyHp}\n` +
              `💥 Expected Attack DMG: ${enemyDamage}\n\n` +
              `👉 Use \`#attack <Skill/Move Name>\` to engage!`
    });
}

// ------------------------------------------------------------------
// ⚔️ PVP CHALLENGE & ACCEPT SYSTEM
// ------------------------------------------------------------------
export async function handlePvp(sock, jid, msg) {
    const attacker = await Player.findOne({ jid });
    if (!attacker || attacker.state !== 'REGISTERED') return;

    if (attacker.activeBattle?.inCombat) {
        await sock.sendMessage(jid, { text: '❌ You are already in a battle!' });
        return;
    }

    const mentionedJidList = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentionedJidList.length) {
        await sock.sendMessage(jid, { text: '❌ Mention a player to challenge! Example: `#pvp @player`' });
        return;
    }

    const targetJid = mentionedJidList[0];
    if (targetJid === jid) {
        await sock.sendMessage(jid, { text: '❌ You cannot fight yourself, bro.' });
        return;
    }

    const targetPlayer = await Player.findOne({ jid: targetJid });
    if (!targetPlayer || targetPlayer.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ Target player is not registered in the Six-Face World!' });
        return;
    }

    if (targetPlayer.activeBattle?.inCombat) {
        await sock.sendMessage(jid, { text: '❌ Target player is currently busy in another battle!' });
        return;
    }

    targetPlayer.activeBattle.pendingPvpFrom = jid;
    await targetPlayer.save();

    await sock.sendMessage(jid, {
        text: `⚔️ **PVP DUEL CHALLENGE!** ⚔️\n\n` +
              `@${jid.split('@')[0]} has challenged @${targetJid.split('@')[0]} to a duel!\n\n` +
              `👉 @${targetJid.split('@')[0]}, type \`#accept\` to start the fight!`,
        mentions: [jid, targetJid]
    });
}

export async function handleAccept(sock, jid) {
    const defender = await Player.findOne({ jid });
    if (!defender || !defender.activeBattle?.pendingPvpFrom) {
        await sock.sendMessage(jid, { text: '❌ You have no pending PvP challenges!' });
        return;
    }

    const challengerJid = defender.activeBattle.pendingPvpFrom;
    const challenger = await Player.findOne({ jid: challengerJid });

    if (!challenger || challenger.activeBattle?.inCombat) {
        await sock.sendMessage(jid, { text: '❌ Challenger is no longer available.' });
        defender.activeBattle.pendingPvpFrom = null;
        await defender.save();
        return;
    }

    // Lock both players in PVP combat
    challenger.activeBattle = {
        inCombat: true,
        type: 'PVP',
        targetJid: defender.jid,
        enemyHp: defender.hp,
        enemyMaxHp: defender.maxHp,
        turn: challenger.jid,
        pendingPvpFrom: null
    };

    defender.activeBattle = {
        inCombat: true,
        type: 'PVP',
        targetJid: challenger.jid,
        enemyHp: challenger.hp,
        enemyMaxHp: challenger.maxHp,
        turn: challenger.jid,
        pendingPvpFrom: null
    };

    await challenger.save();
    await defender.save();

    await sock.sendMessage(jid, {
        text: `🔥 **DUEL STARTED!** 🔥\n\n` +
              `⚔️ **${challenger.name}** vs **${defender.name}**\n\n` +
              `🎲 First Turn: @${challenger.jid.split('@')[0]}\n` +
              `👉 Use \`#attack <Skill/Move Name>\` on your turn!`,
        mentions: [challenger.jid, defender.jid]
    });
}

// ------------------------------------------------------------------
// 💥 MAIN ATTACK ROUTER (QUEST & PVP)
// ------------------------------------------------------------------
export async function handleAttack(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') return;

    if (!player.activeBattle?.inCombat) {
        await sock.sendMessage(jid, { text: '❌ You are not in combat! Start a quest with `#quest` or duel someone with `#pvp @user`.' });
        return;
    }

    if (player.activeBattle.type === 'PVP' && player.activeBattle.turn !== jid) {
        await sock.sendMessage(jid, { text: "⏳ It's not your turn! Wait for your opponent." });
        return;
    }

    const moveTarget = commandArgs.slice(1).join(' ').trim();
    if (!moveTarget) {
        await sock.sendMessage(jid, { text: '❌ Please specify a skill or move name! Example: `#attack water ball`' });
        return;
    }

    let damage = 0;
    let mpCost = 0;
    let attackName = '';

    // Calculate skill / move damage according to class
    if (player.class === 'Summoner') {
        if (!player.activeSummon || !player.activeSummon.name) {
            await sock.sendMessage(jid, { text: '❌ Summon a beast first using `#summon <Beast Name>`!' });
            return;
        }

        const beastData = CLASS_SKILLS.Summoner.find(b => b.name === player.activeSummon.name);
        const move = beastData?.moves.find(m => m.name.toLowerCase() === moveTarget.toLowerCase());

        if (!move) {
            await sock.sendMessage(jid, { text: `❌ ${player.activeSummon.name} doesn't know *${moveTarget}*!` });
            return;
        }

        if (player.mp < move.mpCost) {
            await sock.sendMessage(jid, { text: `❌ Not enough Master MP! (${move.mpCost} MP required)` });
            return;
        }

        damage = move.damage;
        mpCost = move.mpCost;
        attackName = `${player.activeSummon.name}'s *${move.name}*`;
    } else {
        const availableSkills = CLASS_SKILLS[player.class] || [];
        const skillToUse = availableSkills.find(s => s.name.toLowerCase() === moveTarget.toLowerCase());

        if (!skillToUse || !player.learnedSkills.includes(skillToUse.name)) {
            await sock.sendMessage(jid, { text: `❌ You haven't learned *${moveTarget}* yet!` });
            return;
        }

        if (player.mp < skillToUse.mpCost) {
            await sock.sendMessage(jid, { text: `❌ Not enough MP! Required: ${skillToUse.mpCost} MP.` });
            return;
        }

        damage = skillToUse.damage;
        mpCost = skillToUse.mpCost;
        attackName = `*${skillToUse.name}*`;
    }

    // Deduct MP cost
    player.mp -= mpCost;

    // ================================================================
    // A. QUEST COMBAT LOGIC
    // ================================================================
    if (player.activeBattle.type === 'QUEST') {
        player.activeBattle.enemyHp -= damage;

        // VICTORY CONDITION
        if (player.activeBattle.enemyHp <= 0) {
            const rewardCoins = 30 * (player.level || 1);
            const rewardExp = 50 * (player.level || 1);

            const mName = player.activeBattle.monsterName;
            clearCombatState(player);
            
            player.coins += rewardCoins;
            player.exp += rewardExp;

            // Level Up logic
            let leveledUp = false;
            if (player.exp >= player.level * 100) {
                player.level += 1;
                player.maxHp += 20;
                player.maxMp += 10;
                player.hp = player.maxHp;
                player.mp = player.maxMp;
                player.skillPoints += 2;
                leveledUp = true;
            }

            await player.save();

            let winText = `🏆 **VICTORY!** 🏆\n\n` +
                          `💥 You executed ${attackName} dealing **${damage}** damage and slain the **${mName}**!\n\n` +
                          `💰 Rewards: +${rewardCoins} Gold \vert{} +${rewardExp} EXP`;

            if (leveledUp) {
                winText += `\n✨ **LEVEL UP!** You reached **Level ${player.level}**! (+2 SP, HP/MP Refilled)`;
            }

            await sock.sendMessage(jid, { text: winText });
            return;
        }

        // COUNTER-ATTACK BY MONSTER
        const enemyDmg = player.activeBattle.enemyDamage;
        player.hp -= enemyDmg;

        // DEFEAT CONDITION
        if (player.hp <= 0) {
            clearCombatState(player);
            player.hp = Math.round(player.maxHp * 0.3); // revive with 30% hp
            await player.save();

            await sock.sendMessage(jid, {
                text: `💀 **DEFEATED!** 💀\n\n` +
                      `💥 You hit for **${damage}** damage, but the enemy counter-attacked for **${enemyDmg}** damage and knocked you out!\n` +
                      `🏥 You recovered safely in town with ${player.hp} HP.`
            });
            return;
        }

        await player.save();

        await sock.sendMessage(jid, {
            text: `⚔️ **COMBAT TURN** ⚔️\n\n` +
                  `💥 You used ${attackName} (-${mpCost} MP) dealing **${damage}** damage!\n` +
                  `👾 **${player.activeBattle.monsterName}** HP: [${getProgressBar(player.activeBattle.enemyHp, player.activeBattle.enemyMaxHp)}] ${player.activeBattle.enemyHp}/${player.activeBattle.enemyMaxHp}\n\n` +
                  `⚠️ Monster counter-attacked for **${enemyDmg}** damage!\n` +
                  `❤️ Your HP: [${getProgressBar(player.hp, player.maxHp)}] ${player.hp}/${player.maxHp}`
        });
        return;
    }

    // ================================================================
    // B. PVP COMBAT LOGIC
    // ================================================================
    if (player.activeBattle.type === 'PVP') {
        const opponent = await Player.findOne({ jid: player.activeBattle.targetJid });

        if (!opponent) {
            clearCombatState(player);
            await player.save();
            await sock.sendMessage(jid, { text: '❌ Opponent no longer exists. PvP cancelled.' });
            return;
        }

        opponent.hp -= damage;

        // PVP VICTORY CONDITION
        if (opponent.hp <= 0) {
            const goldReward = 50;
            player.coins += goldReward;

            opponent.hp = 10; // leave opponent with 10 HP
            clearCombatState(player);
            clearCombatState(opponent);

            await player.save();
            await opponent.save();

            await sock.sendMessage(jid, {
                text: `👑 **PVP VICTORY!** 👑\n\n` +
                      `💥 @${jid.split('@')[0]} dealt **${damage}** damage using ${attackName} and defeated @${opponent.jid.split('@')[0]}!\n\n` +
                      `💰 Winner Reward: +${goldReward} Gold!`,
                mentions: [jid, opponent.jid]
            });
            return;
        }

        // Switch turns
        player.activeBattle.turn = opponent.jid;
        opponent.activeBattle.turn = opponent.jid;

        await player.save();
        await opponent.save();

        await sock.sendMessage(jid, {
            text: `⚔️ **PVP TURN COMPLETE** ⚔️\n\n` +
                  `💥 @${jid.split('@')[0]} used${attackName} dealing **${damage}** damage!\n` +
                  `❤️ @${opponent.jid.split('@')[0]}'s HP: [${getProgressBar(opponent.hp, opponent.maxHp)}] ${opponent.hp}/${opponent.maxHp}\n\n` +
                  `👉 **Next Turn:** @${opponent.jid.split('@')[0]}!`,
            mentions: [jid, opponent.jid]
        });
    }
}

// ------------------------------------------------------------------
// 🔮 SUMMON & BEAST INFO
// ------------------------------------------------------------------
export async function handleSummon(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.class !== 'Summoner') {
        await sock.sendMessage(jid, { text: '❌ Only Summoners can use #summon!' });
        return;
    }

    const beastTarget = commandArgs.slice(1).join(' ').trim();
    const beastData = CLASS_SKILLS.Summoner.find(b => b.name.toLowerCase() === beastTarget.toLowerCase());

    if (!beastData || !player.learnedSkills.includes(beastData.name)) {
        await sock.sendMessage(jid, { text: `❌ You do not have a contract with *${beastTarget}*! Use \`#tame ${beastTarget}\` first.` });
        return;
    }

    if (player.mp < beastData.mpCost) {
        await sock.sendMessage(jid, { text: `❌ Need ${beastData.mpCost} MP to summon${beastData.name}!` });
        return;
    }

    player.mp -= beastData.mpCost;
    player.activeSummon = {
        name: beastData.name,
        hp: beastData.hp,
        maxHp: beastData.hp
    };
    await player.save();

    await sock.sendMessage(jid, {
        text: `🔮 *SUMMONING RITE COMPLETE!* 🔮\n\n` +
              `✨ You summoned **${beastData.name}**!\n` +
              `❤️ Beast HP: ${beastData.hp}/${beastData.hp}\n` +
              `💧 Remaining Master MP: ${player.mp}/${player.maxMp}\n\n` +
              `*Type #beast to see companion moves!*`
    });
}

export async function handleBeastInfo(sock, jid) {
    const player = await Player.findOne({ jid });

    if (!player || player.class !== 'Summoner') return;

    if (!player.activeSummon || !player.activeSummon.name) {
        await sock.sendMessage(jid, { text: '❌ You have no active beast summoned! Use `#summon <Beast Name>`.' });
        return;
    }

    const beastData = CLASS_SKILLS.Summoner.find(b => b.name === player.activeSummon.name);
    let moveText = '';

    beastData.moves.forEach(m => {
        moveText += `⚔️ *${m.name}*\n├ 💧 Master MP: ${m.mpCost} | 💥 DMG: ${m.damage}\n└ _${m.desc}_\n\n`;
    });

    await sock.sendMessage(jid, {
        text: `🐾 *ACTIVE BEAST: ${player.activeSummon.name.toUpperCase()}*\n` +
              `❤️ HP: [${getProgressBar(player.activeSummon.hp, player.activeSummon.maxHp)}] ${player.activeSummon.hp}/${player.activeSummon.maxHp}\n\n` +
              `─── 📜 *COMMAND MOVES* ───\n${moveText}` +
              `💡 *Command attack:* \`#attack <Move Name>\``
    });
}