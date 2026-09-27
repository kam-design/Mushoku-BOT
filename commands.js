const path = require('path');
const fs = require('fs');
const { Player } = require('./database');
const { GODS_DATABASE, findGod } = require('./God');
const { 
    SUPREME_ADMINS, 
    SKILL_DATABASE, 
    SHOP_ITEMS,
    MAIDENS,
    MONSTER_POOL, 
    RANKS, 
    MAX_ACTIVE_MOVES,
    getMaxExpForLevel, 
    getPlayerLevelBonus, 
    getRandomElement, 
    createProgressBar 
} = require('./config');

function findMaiden(input) {
    if (!input) return null;
    const clean = input.toLowerCase().trim();
    return MAIDENS.find(m => m.id === clean || m.name.toLowerCase() === clean);
}

async function handleCommand(sock, msg) {
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
    const sender = msg.key.remoteJid;
    const participant = msg.key.participant || sender;
    const pushName = msg.pushName || 'Adventurer';
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    console.log(`\n📩 [MESSAGE RECEIVED]`);
    console.log(`👤 Name : ${pushName}`);
    console.log(`🆔 ID   : ${sender}`);
    console.log(`💬 Text : ${text}`);

    switch (command) {
        case '#help': {
            console.log(`⚙️ Executing #help for ${sender}`);

            const helpText = 
                `📜 *MUSHOKU TENSEI BOT COMMANDS*\n\n` +
                `🎮 *CHARACTER & PROGRESSION*\n` +
                `• *#reincarnate* - Start your journey in the Six-Face World.\n` +
                `• *#mage* - Select the Mage class (High MP, Elemental Magic).\n` +
                `• *#warrior* - Select the Warrior class (High SP, Sword Styles).\n` +
                `• *#profile* - Check your rank, level, HP, MP/SP, EXP, Gold, & Equipment.\n` +
                `• *#inventory* - View purchased items and potions.\n\n` +

                `⚔️ *COMBAT & QUESTS*\n` +
                `• *#quest* - Encounter wild monsters to fight for EXP and Gold.\n` +
                `• *#attack* - Deal a basic physical strike.\n` +
                `• *#attack <move ID>* - Cast a learned skill or magic spell in battle.\n` +
                `• *#use <item ID>* - Consume a potion during combat or exploration.\n\n` +

                `👑 *BOSS GODS (WORLD POWERS)*\n` +
                `• *#gods* - View the Seven World Powers.\n` +
                `• *#challenge <name>* - Challenge an OP Boss God for massive rewards!\n\n` +

                `📖 *SKILLS & MOVES*\n` +
                `• *#moves* - View your mastered moves and available spells to learn.\n` +
                `• *#learn <move ID>* - Spend hard-earned EXP to learn new skills.\n` +
                `• *#moves move <move ID> <slot 1-4>* - Reorder your skill loadout slot.\n\n` +

                `🛒 *SHOP & GEAR*\n` +
                `• *#shop* - View items, potions, and class weapons.\n` +
                `• *#buy <item ID>* - Purchase an item from the shop.\n` +
                `• *#equip <item ID>* - Equip a weapon for damage bonuses.\n\n` +

                `🌸 *ROMANCE & MARRIAGE*\n` +
                `• *#waifu* - List available maidens.\n` +
                `• *#<maiden_id>* - View picture of a maiden.\n` +
                `• *#hello <Maiden Name>* - Interact and boost affection.\n` +
                `• *#propose <Maiden Name>* - Propose using a Dragon Scale.\n` +
                `• *#wife* - View your marital perks and wife portrait.\n\n` +

                `🏆 *LEADERBOARD*\n` +
                `• *#lb* / *#top* - View top-ranked adventurers.\n\n` +

                `⚔️ *PVP DUELS*\n` +
                `• *#duel @tag <gold>* - Challenge a player to a PvP duel with a wager.\n` +
                `• *#accept* - Accept a pending PvP challenge.\n` +
                `• *#pvpattack [move ID]* - Strike your rival in active PvP combat.\n\n` +

                `⚙️ *ADMIN & SYSTEM*\n` +
                `• *#givegold @tag <amt>* - (Supreme Admin) Grant gold to a player.\n` +
                `• *#setgold @tag <amt>* - (Supreme Admin) Set exact gold balance.\n` +
                `• *#clear* - Wipe your own character data.\n` +
                `• *#clear @tag* - (Supreme Admin Only) Wipe tagged user's profile.`;

            const imagePath = path.join(__dirname, 'Mushoku.png');

            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(sender, {
                    image: fs.readFileSync(imagePath),
                    caption: helpText
                });
            } else {
                await sock.sendMessage(sender, { text: helpText });
            }
            break;
        }

        case '#gods': {
            console.log(`⚙️ Executing #gods for ${sender}`);

            let godsText = `👑 *THE SEVEN WORLD POWERS (GODS)*\n\n`;
            GODS_DATABASE.forEach((g, idx) => {
                godsText += `*${idx + 1}. ${g.name}* (${g.title})\n` +
                            `   ❤️ HP: ${g.hp} \vert{} ⚔️ ATK: ${g.atk}\n` +
                            `   💰 Reward: 5,000,000 Gold | ⭐ EXP: 100,000\n` +
                            `   _${g.desc}_\n\n`;
            });
            godsText += `📌 *Usage:* Type \`#challenge <god name>\` to challenge one! (e.g. \`#challenge dragon\`)`;

            let imagePath = path.join(__dirname, 'Gods.png');
            if (!fs.existsSync(imagePath)) {
                imagePath = path.join(__dirname, 'Gods.webp');
            }

            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(sender, {
                    image: fs.readFileSync(imagePath),
                    caption: godsText
                });
            } else {
                await sock.sendMessage(sender, { text: godsText });
            }
            break;
        }

        case '#challenge': {
            console.log(`⚙️ Executing #challenge for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            if (player.inCombat) {
                return sock.sendMessage(sender, { 
                    text: `⚠️ *ALREADY IN COMBAT!*\n\nYou are currently fighting *${player.enemy.name}* (HP: ${player.enemy.hp}/${player.enemy.maxHp}).\n\nUse *#attack* to strike!` 
                });
            }

            const targetName = args.join(' ');
            const god = findGod(targetName);

            if (!god) {
                return sock.sendMessage(sender, { text: '❌ Boss God not found! Type *#gods* to list the 7 World Powers.' });
            }

            if (player.hp <= 0) {
                player.hp = Math.floor(player.maxHp * 0.5);
                await player.save();
                return sock.sendMessage(sender, { text: '🩹 You were severely injured! Rested briefly and restored 50% HP.' });
            }

            player.inCombat = true;
            player.enemy = {
                name: `[BOSS] ${god.name}`,
                hp: god.hp,
                maxHp: god.hp,
                atk: god.atk,
                expReward: god.expReward,
                goldReward: god.goldReward
            };

            await player.save();

            const hpBar = createProgressBar(god.hp, god.hp, 10);

            await sock.sendMessage(sender, { 
                text: `⚡ *GODLY CHALLENGE ENGAGED!*\n\n` +
                      `👑 *Boss:* ${player.enemy.name}\n` +
                      `❤️ *HP:* ${god.hp}/${god.hp}\n${hpBar}\n` +
                      `⚔️ *ATK:* ${god.atk}\n\n` +
                      `🏆 *Rewards:* 💰 5,000,000 Gold | ⭐ 100,000 EXP\n\n` +
                      `🗡️ *Use #attack or #attack <move ID> to fight!*`
            });
            break;
        }

        case '#waifu': {
            console.log(`⚙️ Executing #waifu for ${sender}`);

            let helpText = `🌸 *AVAILABLE MAIDENS*\n\n`;
            MAIDENS.forEach(m => {
                helpText += `• *${m.name}* (\`#${m.id}\`)\n  ✨ *Perk:* ${m.perk}\n\n`;
            });
            helpText += `📌 *Commands:*\n` +
                        `• *#<maiden_id>* - View picture (e.g. #roxy)\n` +
                        `• *#hello <name>* - Interact & boost affection\n` +
                        `• *#propose <name>* - Propose with Dragon Scale`;

            const waifuImagePath = path.join(__dirname, 'waifu.png');

            if (fs.existsSync(waifuImagePath)) {
                await sock.sendMessage(sender, {
                    image: fs.readFileSync(waifuImagePath),
                    caption: helpText
                });
            } else {
                await sock.sendMessage(sender, { text: helpText });
            }
            break;
        }

        case '#hello': {
            console.log(`⚙️ Executing #hello for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            const targetName = args.join(' ');
            const maiden = findMaiden(targetName);

            if (!maiden) return sock.sendMessage(sender, { text: '❌ Maiden not found! Type *#waifu* to list available maidens.' });

            const lastTalk = player.lastInteracted?.get(maiden.id);
            const now = new Date();

            if (lastTalk && (now - new Date(lastTalk)) < 3600000) {
                const mins = Math.ceil((3600000 - (now - new Date(lastTalk))) / 60000);
                return sock.sendMessage(sender, { text: `⏳ *${maiden.name}* needs rest. Talk to her again in *${mins} mins*.` });
            }

            const currentAffection = (player.affection?.get(maiden.id) || 0) + 10;
            player.affection.set(maiden.id, currentAffection);
            player.lastInteracted.set(maiden.id, now);
            await player.save();

            await sock.sendMessage(sender, { 
                text: `💖 You spent time talking with *${maiden.name}*!\n\n` +
                      `✨ Affection +10 (Total: ${currentAffection}/100)` 
            });
            break;
        }

        case '#propose': {
            console.log(`⚙️ Executing #propose for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            if (player.spouse) {
                const wife = MAIDENS.find(m => m.id === player.spouse);
                return sock.sendMessage(sender, { text: `💍 You are already married to *${wife?.name || 'someone'}*!` });
            }

            const maiden = findMaiden(args.join(' '));
            if (!maiden) return sock.sendMessage(sender, { text: '❌ Maiden not found! Usage: `#propose <name>`' });

            const affection = player.affection?.get(maiden.id) || 0;
            if (affection < 100) {
                return sock.sendMessage(sender, { text: `💔 *${maiden.name}* doesn't trust you enough yet!\n\nRequired Affection: 100\nCurrent Affection:${affection}` });
            }

            const scaleIndex = player.inventory.findIndex(i => i.id === 'dragon_scale');
            if (scaleIndex === -1 || player.inventory[scaleIndex].qty <= 0) {
                return sock.sendMessage(sender, { text: '❌ You need a 🐉 *Dragon Scale* from the `#shop` to propose!' });
            }

            player.inventory[scaleIndex].qty -= 1;
            if (player.inventory[scaleIndex].qty <= 0) player.inventory.splice(scaleIndex, 1);
            player.spouse = maiden.id;
            await player.save();

            await sock.sendMessage(sender, { 
                text: `💍 *MARRIAGE ACCEPTED!*\n\n` +
                      `🎉 Congratulations! You and *${maiden.name}* are now wed!\n` +
                      `✨ *Active Marriage Perk:* ${maiden.perk}\n\n` +
                      `Type *#wife* to check your marital details!` 
            });
            break;
        }

        case '#wife': {
            console.log(`⚙️ Executing #wife for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            if (!player.spouse) {
                return sock.sendMessage(sender, { text: '💔 You are currently unmarried. Use *#waifu* to find a maiden.' });
            }

            const wife = MAIDENS.find(m => m.id === player.spouse);
            const imagePath = path.join(__dirname, 'NPC', wife.image);

            const text = `💍 *YOUR WIFE: ${wife.name.toUpperCase()}*\n\n` +
                         `✨ *Marital Perk:* ${wife.perk}\n` +
                         `💖 *Affection Level:* Maxed (100+)`;

            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(sender, { image: fs.readFileSync(imagePath), caption: text });
            } else {
                await sock.sendMessage(sender, { text });
            }
            break;
        }

        case '#lb':
        case '#top': {
            console.log(`⚙️ Executing Leaderboard for ${sender}`);
            const topPlayers = await Player.find({ isRegistered: true })
                .sort({ level: -1, exp: -1 })
                .limit(10);

            if (topPlayers.length === 0) {
                return sock.sendMessage(sender, { text: '🏆 No registered adventurers found yet.' });
            }

            let text = `🏆 *WORLD LEADERBOARD (TOP 10)*\n\n`;
            topPlayers.forEach((p, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤';
                text += `${medal} *#${idx + 1} ${p.name}*\n  🏅 Rank: ${p.rank} (Lvl ${p.level}) \vert{} 💰 ${p.gold} Gold\n\n`;
            });

            await sock.sendMessage(sender, { text });
            break;
        }

        case '#clear': {
            console.log(`⚙️ Executing #clear by ${sender}`);
            const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (mentionedJids.length > 0) {
                const isAdmin = SUPREME_ADMINS.includes(sender) || SUPREME_ADMINS.includes(participant);
                if (!isAdmin) {
                    await sock.sendMessage(sender, { text: '❌ *ACCESS DENIED:* Only Supreme Admins can clear other players!' });
                    return;
                }

                const targetJid = mentionedJids[0];
                const deletedPlayer = await Player.findOneAndDelete({ jid: targetJid });

                if (deletedPlayer) {
                    await sock.sendMessage(sender, { 
                        text: `🧹 *SUPREME ADMIN OVERRIDE*\nWiped database profile for: @${targetJid.split('@')[0]}`,
                        mentions: [targetJid]
                    });
                } else {
                    await sock.sendMessage(sender, { 
                        text: `⚠️ No player profile found for @${targetJid.split('@')[0]}.`,
                        mentions: [targetJid]
                    });
                }
            } else {
                const deletedSelf = await Player.findOneAndDelete({ jid: sender });
                if (deletedSelf) {
                    await sock.sendMessage(sender, { text: '🧹 *PROFILE CLEARED*\nYour character profile was deleted. Use *#reincarnate* to restart.' });
                } else {
                    await sock.sendMessage(sender, { text: '⚠️ You don\'t have an active character profile to clear.' });
                }
            }
            break;
        }

        case '#reincarnate': {
            console.log(`⚙️ Executing #reincarnate for ${sender}`);
            let player = await Player.findOne({ jid: sender });

            if (player && player.isRegistered) {
                await sock.sendMessage(sender, { text: `🌀 *Already Reincarnated*\nYou are registered as a *${player.class}*.` });
                return;
            }

            if (!player) {
                player = await Player.create({ jid: sender, name: pushName });
            }

            const reincarnateMsg = 
                `✨ *REINCARNATION PROTOCOL*\n\n` +
                `Welcome to the Six-Face World, *${pushName}*!\n` +
                `Pick your class:\n\n` +
                `🧙‍♂️ *#mage* - High Mana pool, free Heal spell, random Elemental Affinity\n` +
                `⚔️ *#warrior* - High Stamina, random Elemental Sword style\n\n` +
                `*Type #mage or #warrior to proceed.*`;

            await sock.sendMessage(sender, { text: reincarnateMsg });
            break;
        }

        case '#mage': {
            console.log(`⚙️ Executing #mage for ${sender}`);
            let player = await Player.findOne({ jid: sender });
            if (!player) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });
            if (player.isRegistered) return sock.sendMessage(sender, { text: `❌ Already registered as a *${player.class}*!` });

            const element = getRandomElement();
            player.class = 'Mage';
            player.element = element;
            player.hp = 120;
            player.maxHp = 120;
            player.mana = 250;
            player.maxMana = 250;
            player.skills = ['heal'];
            player.level = 1;
            player.exp = 0;
            player.maxExp = getMaxExpForLevel(1);
            player.isRegistered = true;
            await player.save();

            await sock.sendMessage(sender, { 
                text: `🧙‍♂️ *CLASS UNLOCKED: MAGE*\n\n` +
                      `• *Element:* ${element}\n` +
                      `• *Free Skill:* Heal [ID: heal]\n` +
                      `• *HP:* 120 / 120\n` +
                      `• *MP:* 250 / 250\n\n` +
                      `Type *#moves* to view available techniques or *#quest* to fight!` 
            });
            break;
        }

        case '#warrior': {
            console.log(`⚙️ Executing #warrior for ${sender}`);
            let player = await Player.findOne({ jid: sender });
            if (!player) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });
            if (player.isRegistered) return sock.sendMessage(sender, { text: `❌ Already registered as a *${player.class}*!` });

            const element = getRandomElement();
            player.class = 'Warrior';
            player.element = element;
            player.hp = 180;
            player.maxHp = 180;
            player.stamina = 200;
            player.maxStamina = 200;
            player.skills = [];
            player.level = 1;
            player.exp = 0;
            player.maxExp = getMaxExpForLevel(1);
            player.isRegistered = true;
            await player.save();

            await sock.sendMessage(sender, { 
                text: `⚔️ *CLASS UNLOCKED: WARRIOR*\n\n` +
                      `• *Sword Style:* ${element}-Infused Blade\n` +
                      `• *HP:* 180 / 180\n` +
                      `• *SP:* 200 / 200\n\n` +
                      `Type *#moves* to view available techniques or *#quest* to fight!` 
            });
            break;
        }

        case '#moves': {
            console.log(`⚙️ Executing #moves for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            if (args[0]?.toLowerCase() === 'move') {
                const moveId = args[1]?.toLowerCase();
                const targetSlot = parseInt(args[2]);

                if (!moveId || isNaN(targetSlot)) {
                    return sock.sendMessage(sender, { text: '❌ *Usage:* `#moves move <move ID> <slot 1-4>`\nExample: `#moves move fball 1`' });
                }

                if (!player.skills.includes(moveId)) {
                    return sock.sendMessage(sender, { text: `❌ You have not mastered move \`${moveId}\` yet!` });
                }

                if (targetSlot < 1 || targetSlot > MAX_ACTIVE_MOVES) {
                    return sock.sendMessage(sender, { text: `❌ Slot number must be between 1 and ${MAX_ACTIVE_MOVES}.` });
                }

                const existingIndex = player.skills.indexOf(moveId);
                if (existingIndex !== -1) {
                    player.skills.splice(existingIndex, 1);
                }
                player.skills.splice(targetSlot - 1, 0, moveId);

                await player.save();
                return sock.sendMessage(sender, { text: `🔄 *LOADOUT UPDATED!*\n\nMoved \`${moveId}\` to Skill Slot **#${targetSlot}**.` });
            }

            const availableSkills = SKILL_DATABASE[player.class]?.[player.element] || [];
            const resource = player.class === 'Mage' ? 'MP' : 'SP';

            let masteredText = `✨ *MASTERED MOVES*\n`;
            let lockedText = `🔒 *AVAILABLE TO LEARN (EXP COST)*\n`;

            let hasMastered = false;
            let hasLocked = false;

            availableSkills.forEach((s) => {
                const isMastered = player.skills.includes(s.id);
                const powerType = s.dmg < 0 ? `Restores ${Math.abs(s.dmg)} HP` : `Base DMG: ${s.dmg}`;

                if (isMastered) {
                    hasMastered = true;
                    const slotIndex = player.skills.indexOf(s.id) + 1;
                    masteredText += `• *[Slot ${slotIndex}]* \`${s.id}\` - *${s.name}*\n  Cost: ${s.cost}${resource} | ${powerType}\n  _${s.desc}_\n\n`;
                } else {
                    hasLocked = true;
                    lockedText += `• \`${s.id}\` - *${s.name}*\n  EXP Cost: ⭐ ${s.expCost} EXP \vert{} Cost:${s.cost} ${resource}\n  _${s.desc}_\n\n`;
                }
            });

            if (!hasMastered) masteredText += `_None learned yet._\n\n`;
            if (!hasLocked) lockedText += `_All moves mastered!_\n\n`;

            const fullResponse = 
                `📖 *${player.element}${player.class} Techniques*\n` +
                `⭐ *Available EXP:* ${player.exp} EXP\n\n` +
                `${masteredText}` +
                `${lockedText}` +
                `📌 *Commands:*\n` +
                `• *#learn <move ID>* - Learn move using EXP\n` +
                `• *#moves move <move ID> <slot 1-4>* - Swap slot position`;

            await sock.sendMessage(sender, { text: fullResponse });
            break;
        }

        case '#learn': {
            console.log(`⚙️ Executing #learn for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            const skillId = args[0]?.toLowerCase();
            if (!skillId) return sock.sendMessage(sender, { text: '❌ Usage: *#learn <move ID>*</move>' });

            const availableSkills = SKILL_DATABASE[player.class]?.[player.element] || [];
            const skillToLearn = availableSkills.find(s => s.id === skillId);

            if (!skillToLearn) return sock.sendMessage(sender, { text: '❌ Invalid move ID for your class/element.' });
            if (player.skills.includes(skillId)) return sock.sendMessage(sender, { text: `⚠️ You already know *${skillToLearn.name}*!` });

            if (player.exp < skillToLearn.expCost) {
                return sock.sendMessage(sender, { 
                    text: `❌ *INSUFFICIENT EXP!*\n\nRequired: ⭐ ${skillToLearn.expCost} EXP\nYour EXP: ⭐${player.exp} EXP` 
                });
            }

            player.exp -= skillToLearn.expCost;
            player.skills.push(skillId);
            await player.save();

            await sock.sendMessage(sender, { 
                text: `🎉 *NEW MOVE LEARNED!*\n\n✨ You spent ⭐ *${skillToLearn.expCost} EXP* to learn *${skillToLearn.name}* (\`${skillToLearn.id}\`)!` 
            });
            break;
        }

        case '#profile': {
            console.log(`⚙️ Executing #profile for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            const isMage = player.class.toLowerCase() === 'mage';
            const statIcon = isMage ? '💧' : '⚡';
            const statName = isMage ? 'Mana' : 'Stamina';
            const statVal = isMage ? player.mana : player.stamina;
            const statMax = isMage ? player.maxMana : player.maxStamina;

            const currentMaxExp = getMaxExpForLevel(player.level);
            const hpBar = createProgressBar(player.hp, player.maxHp, 10);
            const expBar = createProgressBar(player.exp, currentMaxExp, 10);

            const weapon = SHOP_ITEMS.find(i => i.id === player.equippedWeapon);
            const weaponText = weapon ? `${weapon.name} (+20% Skill DMG)` : 'None';
            const spouse = MAIDENS.find(m => m.id === player.spouse);
            const spouseText = spouse ? spouse.name : 'Single';

            const profileMsg = 
                `📜 *ADVENTURER CARD*\n\n` +
                `👤 *Name:* ${player.name}\n` +
                `🛡️ *Class:* ${player.class} (${player.element})\n` +
                `🏅 *Rank:* ${player.rank} (Lvl${player.level})\n` +
                `⚔️ *Equipped Weapon:* ${weaponText}\n` +
                `💍 *Spouse:* ${spouseText}\n\n` +
                `❤️ *HP:* ${player.hp}/${player.maxHp}\n${hpBar}\n\n` +
                `${statIcon} *${statName}:* ${statVal}/${statMax}\n\n` +
                `⭐ *EXP:* ${player.exp}/${currentMaxExp}\n${expBar}\n\n` +
                `💰 *Gold:* ${player.gold} Coins`;

            await sock.sendMessage(sender, { text: profileMsg });
            break;
        }

        case '#shop': {
            console.log(`⚙️ Executing #shop for ${sender}`);
            let shopText = `🏪 *GUILD SHOP*\n\n`;

            SHOP_ITEMS.forEach(item => {
                shopText += `• \`${item.id}\` - *${item.name}*\n  💰 Price: ${item.price} Gold \vert{} _${item.desc}_\n\n`;
            });

            shopText += `📌 *Use #buy <item ID> to purchase.*`;
            await sock.sendMessage(sender, { text: shopText });
            break;
        }

        case '#buy': {
            console.log(`⚙️ Executing #buy for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            const itemId = args[0]?.toLowerCase();
            const item = SHOP_ITEMS.find(i => i.id === itemId);

            if (!item) return sock.sendMessage(sender, { text: '❌ Invalid Item ID! Check *#shop*.' });
            if (player.gold < item.price) {
                return sock.sendMessage(sender, { text: `❌ You need *${item.price} Gold*, but only have *${player.gold} Gold*.` });
            }

            player.gold -= item.price;
            const existingInvIndex = player.inventory.findIndex(i => i.id === itemId);

            if (existingInvIndex !== -1) {
                player.inventory[existingInvIndex].qty += 1;
            } else {
                player.inventory.push({ id: itemId, qty: 1 });
            }

            await player.save();
            await sock.sendMessage(sender, { text: `🛒 *PURCHASE SUCCESSFUL!*\n\nYou bought *${item.name}* for 💰 ${item.price} Gold.` });
            break;
        }

        case '#inventory': {
            console.log(`⚙️ Executing #inventory for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            if (!player.inventory || player.inventory.length === 0) {
                return sock.sendMessage(sender, { text: '🎒 *INVENTORY EMPTY*\n\nBuy items from the *#shop*.' });
            }

            let invText = `🎒 *YOUR INVENTORY*\n\n`;
            player.inventory.forEach(slot => {
                const item = SHOP_ITEMS.find(i => i.id === slot.id);
                if (item) {
                    invText += `• \`${item.id}\` - *${item.name}* (x${slot.qty})\n  _${item.desc}_\n\n`;
                }
            });

            invText += `📌 *Use #use <item ID> for potions or #equip <item ID> for weapons.*`;
            await sock.sendMessage(sender, { text: invText });
            break;
        }

        case '#equip': {
            console.log(`⚙️ Executing #equip for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            const itemId = args[0]?.toLowerCase();
            const invItem = player.inventory.find(i => i.id === itemId);

            if (!invItem) return sock.sendMessage(sender, { text: '❌ You do not own this weapon!' });

            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (!item || item.type !== 'weapon') {
                return sock.sendMessage(sender, { text: '❌ That item is not equipable equipment!' });
            }

            if (item.classReq && player.class !== item.classReq) {
                return sock.sendMessage(sender, { text: `❌ Only *${item.classReq}* class can equip this weapon!` });
            }

            player.equippedWeapon = item.id;
            await player.save();

            await sock.sendMessage(sender, { text: `⚔️ *EQUIPPED:* You equipped *${item.name}*! (+20% Skill Damage)` });
            break;
        }

        case '#use': {
            console.log(`⚙️ Executing #use for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            const itemId = args[0]?.toLowerCase();
            const invIndex = player.inventory.findIndex(i => i.id === itemId);

            if (invIndex === -1 || player.inventory[invIndex].qty <= 0) {
                return sock.sendMessage(sender, { text: '❌ Item not found in your inventory!' });
            }

            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (!item || item.type !== 'potion') {
                return sock.sendMessage(sender, { text: '❌ You can only `#use` potion items!' });
            }

            let msgText = '';
            if (item.stat === 'hp') {
                player.hp = Math.min(player.maxHp, player.hp + item.value);
                msgText = `🧪 *POTION USED:* Restored *+${item.value} HP*! (Current: ${player.hp}/${player.maxHp})`;
            } else if (item.stat === 'mp') {
                if (player.class === 'Mage') {
                    player.mana = Math.min(player.maxMana, player.mana + item.value);
                    msgText = `🧪 *POTION USED:* Restored *+${item.value} MP*! (Current: ${player.mana}/${player.maxMana})`;
                } else {
                    player.stamina = Math.min(player.maxStamina, player.stamina + item.value);
                    msgText = `🧪 *POTION USED:* Restored *+${item.value} SP*! (Current: ${player.stamina}/${player.maxStamina})`;
                }
            }

            player.inventory[invIndex].qty -= 1;
            if (player.inventory[invIndex].qty <= 0) {
                player.inventory.splice(invIndex, 1);
            }

            await player.save();
            await sock.sendMessage(sender, { text: msgText });
            break;
        }

        case '#givegold': {
            console.log(`⚙️ Executing #givegold by ${sender}`);
            const isAdmin = SUPREME_ADMINS.includes(sender) || SUPREME_ADMINS.includes(participant);
            if (!isAdmin) return sock.sendMessage(sender, { text: '❌ *ACCESS DENIED:* Supreme Admin required!' });

            const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const amount = parseInt(args[args.length - 1]);

            if (mentionedJids.length === 0 || isNaN(amount)) {
                return sock.sendMessage(sender, { text: '❌ *Usage:* `#givegold @user <amount>`' });
            }

            const targetJid = mentionedJids[0];
            const targetPlayer = await Player.findOne({ jid: targetJid });

            if (!targetPlayer) return sock.sendMessage(sender, { text: '❌ Target player not found.' });

            targetPlayer.gold += amount;
            await targetPlayer.save();

            await sock.sendMessage(sender, { 
                text: `💰 *ADMIN GOLD ADDED*\n\nAdded 💰 *${amount} Gold* to @${targetJid.split('@')[0]}.\nNew Balance: 💰 ${targetPlayer.gold} Gold`,
                mentions: [targetJid]
            });
            break;
        }

        case '#setgold': {
            console.log(`⚙️ Executing #setgold by ${sender}`);
            const isAdmin = SUPREME_ADMINS.includes(sender) || SUPREME_ADMINS.includes(participant);
            if (!isAdmin) return sock.sendMessage(sender, { text: '❌ *ACCESS DENIED:* Supreme Admin required!' });

            const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const amount = parseInt(args[args.length - 1]);

            if (mentionedJids.length === 0 || isNaN(amount)) {
                return sock.sendMessage(sender, { text: '❌ *Usage:* `#setgold @user <amount>`' });
            }

            const targetJid = mentionedJids[0];
            const targetPlayer = await Player.findOne({ jid: targetJid });

            if (!targetPlayer) return sock.sendMessage(sender, { text: '❌ Target player not found.' });

            targetPlayer.gold = amount;
            await targetPlayer.save();

            await sock.sendMessage(sender, { 
                text: `💰 *ADMIN GOLD SET*\n\nSet balance for @${targetJid.split('@')[0]} to 💰 *${amount} Gold*.`,
                mentions: [targetJid]
            });
            break;
        }

        case '#duel': {
            console.log(`⚙️ Executing #duel for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            const mentionedJids = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const wager = parseInt(args[args.length - 1]);

            if (mentionedJids.length === 0 || isNaN(wager) || wager < 0) {
                return sock.sendMessage(sender, { text: '❌ *Usage:* `#duel @user <gold wager>`' });
            }

            const targetJid = mentionedJids[0];
            if (targetJid === sender) return sock.sendMessage(sender, { text: '❌ You cannot duel yourself!' });

            const opponent = await Player.findOne({ jid: targetJid });
            if (!opponent || !opponent.isRegistered) {
                return sock.sendMessage(sender, { text: '❌ Target player is not registered!' });
            }

            if (player.gold < wager) return sock.sendMessage(sender, { text: `❌ You lack 💰 ${wager} Gold for this wager!` });
            if (opponent.gold < wager) return sock.sendMessage(sender, { text: `❌ @${targetJid.split('@')[0]} lacks 💰 ${wager} Gold!`, mentions: [targetJid] });

            opponent.pvpState.pendingChallengeFrom = sender;
            await opponent.save();

            await sock.sendMessage(sender, { 
                text: `⚔️ *PVP CHALLENGE ISSUED!*\n\n` +
                      `@${sender.split('@')[0]} challenged @${targetJid.split('@')[0]} to a duel for 💰 *${wager} Gold*!\n\n` +
                      `@${targetJid.split('@')[0]}, type *#accept* to start the fight!`,
                mentions: [sender, targetJid]
            });
            break;
        }

        case '#accept': {
            console.log(`⚙️ Executing #accept for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.pvpState.pendingChallengeFrom) {
                return sock.sendMessage(sender, { text: '❌ No pending duel challenge found.' });
            }

            const challengerJid = player.pvpState.pendingChallengeFrom;
            const challenger = await Player.findOne({ jid: challengerJid });

            if (!challenger) return sock.sendMessage(sender, { text: '❌ Challenger no longer exists.' });

            player.pvpState.inPvp = true;
            player.pvpState.opponentJid = challengerJid;
            player.pvpState.isTurn = false;
            player.pvpState.pendingChallengeFrom = null;

            challenger.pvpState.inPvp = true;
            challenger.pvpState.opponentJid = sender;
            challenger.pvpState.isTurn = true;

            await player.save();
            await challenger.save();

            await sock.sendMessage(sender, { 
                text: `⚔️ *DUEL STARTED!*\n\n` +
                      `@${challengerJid.split('@')[0]} vs @${sender.split('@')[0]}\n\n` +
                      `It is @${challengerJid.split('@')[0]}'s turn to strike! Use *#pvpattack [move ID]*`,
                mentions: [challengerJid, sender]
            });
            break;
        }

        case '#pvpattack': {
            console.log(`⚙️ Executing #pvpattack for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.pvpState.inPvp) {
                return sock.sendMessage(sender, { text: '❌ You are not in a PvP duel!' });
            }

            if (!player.pvpState.isTurn) {
                return sock.sendMessage(sender, { text: '⏳ It is not your turn yet!' });
            }

            const opponent = await Player.findOne({ jid: player.pvpState.opponentJid });
            if (!opponent) return sock.sendMessage(sender, { text: '❌ Opponent left the fight.' });

            const skillId = args[0]?.toLowerCase();
            const levelDmgBonus = getPlayerLevelBonus(player.level);
            let dmg = 20 + levelDmgBonus + Math.floor(Math.random() * 8);
            let actionText = `🗡️ @${sender.split('@')[0]} basic struck for *${dmg} DMG*!`;

            if (skillId) {
                const availableSkills = SKILL_DATABASE[player.class]?.[player.element] || [];
                const skill = availableSkills.find(s => s.id === skillId);

                if (skill && player.skills.includes(skillId)) {
                    let baseDmg = skill.dmg;
                    if (player.equippedWeapon && player.class === 'Warrior') {
                        baseDmg = Math.floor(baseDmg * 1.20);
                    }

                    if (baseDmg < 0) {
                        const healAmt = Math.abs(baseDmg) + levelDmgBonus;
                        player.hp = Math.min(player.maxHp, player.hp + healAmt);
                        actionText = `✨ @${sender.split('@')[0]} used *${skill.name}* and healed *+${healAmt} HP*!`;
                        dmg = 0;
                    } else {
                        dmg = baseDmg + levelDmgBonus + Math.floor(Math.random() * 10);
                        actionText = `💥 @${sender.split('@')[0]} cast *${skill.name}* dealing *${dmg} DMG*!`;
                    }
                }
            }

            opponent.hp -= dmg;

            if (opponent.hp <= 0) {
                opponent.hp = 0;
                player.pvpState.inPvp = false;
                opponent.pvpState.inPvp = false;

                await player.save();
                await opponent.save();

                return sock.sendMessage(sender, { 
                    text: `🏆 *PVP VICTORY!*\n\n${actionText}\n\n@${sender.split('@')[0]} defeated @${opponent.jid.split('@')[0]} in combat!`,
                    mentions: [sender, opponent.jid]
                });
            }

            player.pvpState.isTurn = false;
            opponent.pvpState.isTurn = true;

            await player.save();
            await opponent.save();

            const p1HpBar = createProgressBar(player.hp, player.maxHp, 10);
            const p2HpBar = createProgressBar(opponent.hp, opponent.maxHp, 10);

            await sock.sendMessage(sender, { 
                text: `${actionText}\n\n` +
                      `❤️ @${sender.split('@')[0]}:${player.hp}/${player.maxHp}\n${p1HpBar}\n` +
                      `❤️ @${opponent.jid.split('@')[0]}:${opponent.hp}/${opponent.maxHp}\n${p2HpBar}\n\n` +
                      `👉 Next turn: @${opponent.jid.split('@')[0]}`,
                mentions: [sender, opponent.jid]
            });
            break;
        }

        case '#quest': {
            console.log(`⚙️ Executing #quest for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            if (player.inCombat) {
                return sock.sendMessage(sender, { 
                    text: `⚠️ *ALREADY IN COMBAT!*\n\nYou are currently fighting *${player.enemy.name}* (HP: ${player.enemy.hp}/${player.enemy.maxHp}).\n\nUse *#attack* or *#attack <move ID>* to strike!` 
                });
            }

            if (player.hp <= 0) {
                player.hp = Math.floor(player.maxHp * 0.5);
                await player.save();
                return sock.sendMessage(sender, { text: '🩹 You were severely injured! Rested briefly and restored 50% HP. Try *#quest* again.' });
            }

            const baseTemplate = MONSTER_POOL[Math.floor(Math.random() * MONSTER_POOL.length)];
            const monsterHp = baseTemplate.hpMult + (player.level * 25);
            const monsterAtk = baseTemplate.atkMult + (player.level * 5);
            const expReward = baseTemplate.expMult + (player.level * 30);
            let goldReward = baseTemplate.goldMult + (player.level * 10);

            if (player.spouse === 'elinalise') {
                goldReward = Math.floor(goldReward * 1.15);
            }

            player.inCombat = true;
            player.enemy = {
                name: `${baseTemplate.name} (Lvl${player.level})`,
                hp: monsterHp,
                maxHp: monsterHp,
                atk: monsterAtk,
                expReward,
                goldReward
            };

            await player.save();

            const enemyBar = createProgressBar(monsterHp, monsterHp, 10);

            await sock.sendMessage(sender, { 
                text: `⚔️ *QUEST SPOTTED: MONSTER ENCOUNTER*\n\n` +
                      `👾 *Target:* ${player.enemy.name}\n` +
                      `❤️ *Enemy HP:* ${monsterHp}/${monsterHp}\n${enemyBar}\n\n` +
                      `🗡️ *Commands:*\n` +
                      `• *#attack* - Normal Strike (Free)\n` +
                      `• *#attack <move ID>* - Use learned technique\n` +
                      `• *#use <item ID>* - Drink a potion`
            });
            break;
        }

        case '#attack': {
            console.log(`⚙️ Executing #attack for ${sender}`);
            const player = await Player.findOne({ jid: sender });
            if (!player || !player.isRegistered) return sock.sendMessage(sender, { text: '❌ Type *#reincarnate* first.' });

            if (!player.inCombat || !player.enemy) {
                return sock.sendMessage(sender, { text: '❌ No active combat! Type *#quest* or *#challenge <god>* to fight.' });
            }

            const skillId = args[0]?.toLowerCase();
            const isMage = player.class.toLowerCase() === 'mage';
            const levelDmgBonus = getPlayerLevelBonus(player.level);

            let playerDmg = 0;
            let actionText = '';

            if (skillId) {
                const availableSkills = SKILL_DATABASE[player.class]?.[player.element] || [];
                const skill = availableSkills.find(s => s.id === skillId);

                if (!skill) {
                    return sock.sendMessage(sender, { text: `❌ Move ID \`${skillId}\` non-existent for your style.` });
                }

                if (!player.skills.includes(skillId)) {
                    return sock.sendMessage(sender, { text: `❌ You haven't learned \`${skillId}\` yet! Learn it with *#learn ${skillId}*.` });
                }

                if (isMage) {
                    if (player.mana < skill.cost) {
                        return sock.sendMessage(sender, { text: `❌ Low Mana! Required: ${skill.cost} MP, Available:${player.mana} MP.` });
                    }
                    player.mana -= skill.cost;
                } else {
                    if (player.stamina < skill.cost) {
                        return sock.sendMessage(sender, { text: `❌ Low Stamina! Required: ${skill.cost} SP, Available:${player.stamina} SP.` });
                    }
                    player.stamina -= skill.cost;
                }

                let baseDmg = skill.dmg;

                if (player.equippedWeapon && player.class === 'Warrior') {
                    baseDmg = Math.floor(baseDmg * 1.20);
                }

                if (baseDmg < 0) {
                    const healAmt = Math.abs(baseDmg) + levelDmgBonus;
                    player.hp = Math.min(player.maxHp, player.hp + healAmt);
                    actionText = `✨ You cast *${skill.name}* and restored *+${healAmt} HP*!`;
                    playerDmg = 0;
                } else {
                    playerDmg = baseDmg + levelDmgBonus + Math.floor(Math.random() * 10);
                    actionText = `💥 You unleashed *${skill.name}* dealing *${playerDmg} DMG*!`;
                }
            } else {
                playerDmg = 20 + levelDmgBonus + Math.floor(Math.random() * 8);
                actionText = `🗡️ You dealt a basic strike for *${playerDmg} DMG*!`;
            }

            player.enemy.hp -= playerDmg;

            if (player.enemy.hp <= 0) {
                const goldGained = player.enemy.goldReward;
                let expGained = player.enemy.expReward;
                const enemyName = player.enemy.name;

                if (player.spouse === 'lila') {
                    expGained = Math.floor(expGained * 1.10);
                }

                if (player.spouse === 'zenith') {
                    player.hp = Math.min(player.maxHp, player.hp + 10);
                }

                player.inCombat = false;
                player.enemy = undefined;
                player.gold += goldGained;
                player.exp += expGained;

                let levelUpText = '';
                let targetMaxExp = getMaxExpForLevel(player.level);

                while (player.exp >= targetMaxExp) {
                    player.level += 1;
                    player.exp -= targetMaxExp;
                    targetMaxExp = getMaxExpForLevel(player.level);
                    player.maxExp = targetMaxExp;

                    const healthBoost = (player.level % 5 === 0) ? 100 : 30;
                    player.maxHp += healthBoost;
                    player.hp = player.maxHp;

                    if (isMage) {
                        player.maxMana += 50;
                        player.mana = player.maxMana;
                    } else {
                        player.maxStamina += 40;
                        player.stamina = player.maxStamina;
                    }

                    const rankIndex = Math.min(Math.floor(player.level / 5), RANKS.length - 1);
                    player.rank = RANKS[rankIndex];

                    levelUpText += 
                        `\n\n🎉 *LEVEL UP! You reached Level ${player.level}!*\n` +
                        `🏅 *Adventurer Rank:* ${player.rank}\n` +
                        `❤️ *Max HP Increased:* +${healthBoost} (Restored)\n` +
                        `⭐ *Next Level Requirement:* ${targetMaxExp} EXP`;
                }

                await player.save();

                return sock.sendMessage(sender, { 
                    text: `🎉 *VICTORY!*\n\n` +
                          `${actionText}\n` +
                          `You defeated *${enemyName}*!\n\n` +
                          `💰 *Gold:* +${goldGained.toLocaleString()} Coins\n` +
                          `⭐ *EXP:* +${expGained.toLocaleString()} Points` + levelUpText 
                });
            }

            const enemyAtk = player.enemy.atk + Math.floor(Math.random() * 10);
            player.hp -= enemyAtk;

            if (player.hp <= 0) {
                player.hp = 0;
                player.inCombat = false;
                player.enemy = undefined;
                await player.save();

                return sock.sendMessage(sender, { 
                    text: `💀 *YOU WERE SLAIN IN COMBAT!*\n\n` +
                          `${actionText}\n` +
                          `The boss counter-attacked with overwhelming force for *${enemyAtk} DMG*!\n\n` +
                          `Rest up and prepare before taking on the Gods again.` 
                });
            }

            await player.save();

            const enemyBar = createProgressBar(Math.max(0, player.enemy.hp), player.enemy.maxHp, 10);
            const playerHpBar = createProgressBar(Math.max(0, player.hp), player.maxHp, 10);

            const turnMsg = 
                `${actionText}\n` +
                `👾 *${player.enemy.name}:*${Math.max(0, player.enemy.hp)}/${player.enemy.maxHp} HP\n${enemyBar}\n\n` +
                `💥 Enemy counters for *${enemyAtk} DMG*!\n` +
                `❤️ *Your HP:* ${player.hp}/${player.maxHp}\n${playerHpBar}`;

            await sock.sendMessage(sender, { text: turnMsg });
            break;
        }

        default: {
            if (command.startsWith('#')) {
                const maidenId = command.slice(1);
                const maiden = findMaiden(maidenId);

                if (maiden) {
                    console.log(`⚙️ Executing portrait view for maiden: ${maiden.id}`);
                    const imagePath = path.join(__dirname, 'NPC', maiden.image);
                    const caption = `🌸 *${maiden.name}*\n✨ *Perk:*${maiden.perk}`;

                    if (fs.existsSync(imagePath)) {
                        await sock.sendMessage(sender, { image: fs.readFileSync(imagePath), caption });
                    } else {
                        await sock.sendMessage(sender, { text: `📷 Image for ${maiden.name} not found at: \`${imagePath}\`` });
                    }
                }
            }
            break;
        }
    }
}

module.exports = { handleCommand };