// =====================================================================
// AMARKA: ?shop
// =====================================================================

const { EmbedBuilder } = require('discord.js');
const { userData }     = require('../store');
const { PREFIX, SHOP_ITEMS } = require('../config');

module.exports = async function shopCommand(message) {
    const userId = message.author.id;

    const embed = new EmbedBuilder()
        .setTitle('🛒 Dukaanka Garaad')
        .setDescription(`XP-gaaga: **${userData[userId].xp} XP**\n\nSi aad u iibsato, isticmaal: \`${PREFIX}buy [shay]\``)
        .addFields(
            ...Object.entries(SHOP_ITEMS).map(([key, item]) => ({
                name:   `${item.name} — ${item.price} XP`,
                value:  `\`${PREFIX}buy ${key}\`\n${item.desc}`,
                inline: false,
            }))
        )
        .setColor('#16a085');

    return message.reply({ embeds: [embed] });
};
