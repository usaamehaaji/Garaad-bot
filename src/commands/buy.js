// =====================================================================
// AMARKA: ?buy [shay]
// =====================================================================

const { userData, saveData } = require('../store');
const { PREFIX, SHOP_ITEMS } = require('../config');

module.exports = async function buyCommand(message, args) {
    const userId  = message.author.id;
    const itemKey = (args[0] || '').toLowerCase();
    const item    = SHOP_ITEMS[itemKey];

    if (!item) {
        return message.reply(`⚠️ Shay aan jirin. Eeg dukaanka: \`${PREFIX}shop\``);
    }
    if (userData[userId].xp < item.price) {
        return message.reply(
            `⚠️ XP-gaagu ma filna! Waxaad u baahan tahay **${item.price} XP**, waxaadse haysataa **${userData[userId].xp} XP**.`
        );
    }

    userData[userId].xp -= item.price;

    if (itemKey === 'shield') {
        userData[userId].shields++;
    } else if (itemKey === 'double') {
        userData[userId].doubleXpUntil = Date.now() + 60 * 60 * 1000; // 1 saacad
    } else if (['profesor', 'garaad', 'caalin'].includes(itemKey)) {
        userData[userId].title = itemKey.charAt(0).toUpperCase() + itemKey.slice(1);
    }

    saveData();
    return message.reply(`✅ Waxaad iibsatay **${item.name}** (-${item.price} XP). Mahadsanid!`);
};
