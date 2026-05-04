// =====================================================================
// AMARKA: ?shop
// =====================================================================

const { EmbedBuilder } = require('discord.js');
const { userData }     = require('../store');
const { PREFIX, SHOP_ITEMS, TITLES } = require('../config');

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
            })),
            { name: '\u200B', value: '**🏷️ Titles:**', inline: false },
            ...Object.entries(TITLES).flatMap(([category, titles]) =>
                Object.entries(titles).filter(([key, title]) => title.price > 0).map(([key, title]) => ({
                    name:   `${title.name} — ${title.price} XP`,
                    value:  `\`${PREFIX}buy ${key}\`\n${title.desc}`,
                    inline: false,
                }))
            )
        )
        .setColor('#16a085');

    return message.reply({ embeds: [embed] });
};
