import { Player } from '../models/Player.js';
import { SHOP_CATALOG } from '../config/shop.js';

export async function handleShop(sock, jid) {
    let text = `╔═════════════════════════╗\n   🛒 *ROA MARKET & GUILD SHOP* 🛒\n╚═════════════════════════╝\n\n`;

    SHOP_CATALOG.forEach((item, idx) => {
        text += `*${idx + 1}. ${item.name}* ── 🪙 ${item.cost} Gold\n` +
                `├ 🏷️ Type: ${item.type.toUpperCase()}\n` +
                `└ 📜 _${item.desc}_\n\n`;
    });

    text += `💡 *To purchase an item:* \`#buy <Item Name>\``;
    await sock.sendMessage(jid, { text });
}

export async function handleBuy(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate and pick a class first!' });
        return;
    }

    const itemTarget = commandArgs.slice(1).join(' ').trim();
    if (!itemTarget) {
        await sock.sendMessage(jid, { text: '❌ Specify an item to buy! Example: `#buy Minor Health Potion`' });
        return;
    }

    const item = SHOP_CATALOG.find(i => i.name.toLowerCase() === itemTarget.toLowerCase());
    if (!item) {
        await sock.sendMessage(jid, { text: `❌ *${itemTarget}* is not available in the store!` });
        return;
    }

    if (player.coins < item.cost) {
        await sock.sendMessage(jid, { text: `❌ Not enough Gold! Required: 🪙 ${item.cost} Gold (You have 🪙 ${player.coins} Gold).` });
        return;
    }

    player.coins -= item.cost;

    const invItem = player.inventory.find(i => i.name === item.name);
    if (invItem) {
        invItem.quantity += 1;
    } else {
        player.inventory.push({ name: item.name, quantity: 1 });
    }

    await player.save();

    await sock.sendMessage(jid, {
        text: `🛍️ *PURCHASE SUCCESSFUL!* 🛍️\n\n` +
              `📦 Bought **${item.name}** for 🪙 ${item.cost} Gold.\n` +
              `🪙 Remaining Balance: ${player.coins} Gold.`
    });
}

export async function handleInventory(sock, jid) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') {
        await sock.sendMessage(jid, { text: '❌ You must reincarnate first!' });
        return;
    }

    if (!player.inventory || player.inventory.length === 0) {
        await sock.sendMessage(jid, { text: '🎒 Your inventory is empty! Visit `#shop` to buy supplies.' });
        return;
    }

    let invText = `🎒 *${player.name.toUpperCase()}'S INVENTORY* 🎒\n\n`;
    player.inventory.forEach(item => {
        invText += `📦 **${item.name}** ×${item.quantity}\n`;
    });

    invText += `\n💡 *Use item:* \`#use <Item Name>\``;
    await sock.sendMessage(jid, { text: invText });
}

export async function handleUse(sock, jid, commandArgs) {
    const player = await Player.findOne({ jid });

    if (!player || player.state !== 'REGISTERED') return;

    const itemTarget = commandArgs.slice(1).join(' ').trim();
    const invItem = player.inventory.find(i => i.name.toLowerCase() === itemTarget.toLowerCase() && i.quantity > 0);

    if (!invItem) {
        await sock.sendMessage(jid, { text: `❌ You don't have any *${itemTarget}* in your inventory!` });
        return;
    }

    const itemData = SHOP_CATALOG.find(i => i.name.toLowerCase() === invItem.name.toLowerCase());

    if (!itemData || itemData.type === 'equipment') {
        await sock.sendMessage(jid, { text: `❌ Equipment items are passive and cannot be directly used.` });
        return;
    }

    let message = '';

    if (itemData.effect?.hp) {
        const heal = itemData.effect.hp;
        player.hp = Math.min(player.maxHp, player.hp + heal);
        message = `❤️ Used **${itemData.name}**! Restored ${heal} HP. (${player.hp}/${player.maxHp} HP)`;
    }

    if (itemData.effect?.mp) {
        const mpRestore = itemData.effect.mp;
        player.mp = Math.min(player.maxMp, player.mp + mpRestore);
        message = `🔵 Used **${itemData.name}**! Restored ${mpRestore} MP. (${player.mp}/${player.maxMp} MP)`;
    }

    if (itemData.effect?.beastHp) {
        if (!player.activeSummon || !player.activeSummon.name) {
            await sock.sendMessage(jid, { text: `❌ You need an active beast summoned to use beast feed!` });
            return;
        }

        const beastHeal = itemData.effect.beastHp;
        player.activeSummon.hp = Math.min(player.activeSummon.maxHp, player.activeSummon.hp + beastHeal);
        message = `🐾 Fed **${itemData.name}** to **${player.activeSummon.name}**! Restored ${beastHeal} Beast HP. (${player.activeSummon.hp}/${player.activeSummon.maxHp} HP)`;
    }

    invItem.quantity -= 1;
    if (invItem.quantity <= 0) {
        player.inventory = player.inventory.filter(i => i.name !== invItem.name);
    }

    await player.save();
    await sock.sendMessage(jid, { text: `✨ ${message}` });
}