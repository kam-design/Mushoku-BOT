import { Player } from '../models/Player.js';
import { CLASS_SKILLS } from '../config/skills.js';

export async function handleSkillsList(sock, jid) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate and pick a class first!' });
        return;
    }

    const availableSkills = CLASS_SKILLS[player.class] || [];
    let skillListText = '';

    availableSkills.forEach((s) => {
        const isLearned = player.learnedSkills.includes(s.name);
        const statusTag = isLearned ? '✅ *[Contracted/Learned]*' : `🔒 *[Cost: ${s.cost} SP]*`;

        if (player.class === 'Summoner') {
            skillListText += `🐾 *${s.name}*${statusTag}\n` +
                             `├ 💧 Summon MP: ${s.mpCost} | ❤️ Beast HP: ${s.hp}\n` +
                             `└ 📜 _${s.desc}_\n\n`;
        } else {
            skillListText += `🔸 *${s.name}*${statusTag}\n` +
                             `├ 💧 MP: ${s.mpCost} \vert{} 💥 DMG: ${s.damage}\n` +
                             `└ 📜 _${s.desc}_\n\n`;
        }
    });

    const actionHint = player.class === 'Summoner' 
        ? '`#tame <Beast Name>` (e.g. #tame Slime)' 
        : '`#learn <Skill Name>` (e.g. #learn Water Ball)';

    const skillTreeText = 
`=============================
   📜 *${player.class.toUpperCase()}${player.class === 'Summoner' ? 'BEAST CONTRACTS' : 'SKILL TREE'}* 📜
=============================

👤 **Adventurer:** ${player.name}
🌟 **Available SP:** ${player.skillPoints} SP

─────────────────────────
${skillListText}─────────────────────────
💡 *To acquire, type:*
${actionHint}`;

    await sock.sendMessage(jid, { text: skillTreeText });
}

export async function handleTame(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate and pick a class first!' });
        return;
    }

    if (player.class !== 'Summoner') {
        await sock.sendMessage(jid, { text: '❌ Only Summoners can tame beasts! Mages and Warriors use `#learn`.' });
        return;
    }

    const beastTarget = commandArgs.slice(1).join(' ').trim();
    if (!beastTarget) {
        await sock.sendMessage(jid, { text: '❌ Specify a beast to tame! Example: `#tame Slime`' });
        return;
    }

    const availableBeasts = CLASS_SKILLS.Summoner || [];
    const beastToTame = availableBeasts.find(b => b.name.toLowerCase() === beastTarget.toLowerCase());

    if (!beastToTame) {
        await sock.sendMessage(jid, { text: `❌ *${beastTarget}* is not a known beast species!` });
        return;
    }

    if (player.learnedSkills.includes(beastToTame.name)) {
        await sock.sendMessage(jid, { text: `⚠️ You already have a contract with **${beastToTame.name}**!` });
        return;
    }

    if (player.skillPoints < beastToTame.cost) {
        await sock.sendMessage(jid, { 
            text: `❌ Not enough Taming Points (SP)! Required: ${beastToTame.cost} SP (You have${player.skillPoints} SP).` 
        });
        return;
    }

    player.skillPoints -= beastToTame.cost;
    player.learnedSkills.push(beastToTame.name);
    await player.save();

    await sock.sendMessage(jid, {
        text: `🔮 *CONTRACT SEALED!* 🔮\n\n` +
              `📜 You have successfully tamed **${beastToTame.name}**!\n` +
              `❤️ Beast Base HP: ${beastToTame.hp}\n` +
              `💧 Summon MP Cost: ${beastToTame.mpCost} MP\n` +
              `🌟 Remaining SP: ${player.skillPoints}\n\n` +
              `*Call your beast into battle using:* \`#summon ${beastToTame.name}\``
    });
}

export async function handleLearn(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate and pick a class first!' });
        return;
    }

    if (player.class === 'Summoner') {
        await sock.sendMessage(jid, { text: '❌ Summoners do not learn spells! Use `#tame <Beast Name>` to forge contracts.' });
        return;
    }

    const skillTarget = commandArgs.slice(1).join(' ').trim();
    if (!skillTarget) {
        await sock.sendMessage(jid, { text: '❌ Specify a skill to learn! Example: `#learn Water Ball`' });
        return;
    }

    const availableSkills = CLASS_SKILLS[player.class] || [];
    const skillToLearn = availableSkills.find(s => s.name.toLowerCase() === skillTarget.toLowerCase());

    if (!skillToLearn) {
        await sock.sendMessage(jid, { text: `❌ *${skillTarget}* is not in the${player.class} skill tree!` });
        return;
    }

    if (player.learnedSkills.includes(skillToLearn.name)) {
        await sock.sendMessage(jid, { text: `⚠️ You have already mastered *${skillToLearn.name}*!` });
        return;
    }

    if (player.skillPoints < skillToLearn.cost) {
        await sock.sendMessage(jid, { 
            text: `❌ Not enough Skill Points! Required: ${skillToLearn.cost} SP (You have${player.skillPoints} SP).` 
        });
        return;
    }

    player.skillPoints -= skillToLearn.cost;
    player.learnedSkills.push(skillToLearn.name);
    await player.save();

    await sock.sendMessage(jid, {
        text: `✨ *SKILL MASTERED!* ✨\n\n` +
              `📜 You learned *${skillToLearn.name}*!\n` +
              `💧 MP Cost: ${skillToLearn.mpCost}\n` +
              `💥 Base Damage: ${skillToLearn.damage}\n` +
              `🌟 Remaining SP: ${player.skillPoints}`
    });
}