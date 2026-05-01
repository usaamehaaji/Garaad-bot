// =====================================================================
// AMARKA: ?profile [@user]
// =====================================================================

const { EmbedBuilder } = require('discord.js');
const { userData }     = require('../store');
const { checkUser, getLevel } = require('../utils/helpers');

module.exports = async function profileCommand(message) {
    const target = message.mentions.users.first() || message.author;
    checkUser(target.id);
    const data = userData[target.id];

    const level      = getLevel(data.iq);
    const nextLvlIq  = (level + 1) * 200;
    const titleTag   = data.title ? `[${data.title}] ` : '';

    const embed = new EmbedBuilder()
        .setTitle(`👤 Profile-ka Garaad: ${titleTag}${target.username}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '🧠 IQ Score',    value: `**${data.iq} IQ**`,    inline: true },
            { name: '✨ XP Points',   value: `**${data.xp} XP**`,    inline: true },
            { name: '📈 Level',       value: `**Level ${level}**`,   inline: true },
            { name: '🎯 Heerka xiga', value: `**${nextLvlIq} IQ** ayaa Level ${level + 1} ku gaarsiinaya`, inline: false },
            { name: '⭐ Stars',       value: `**${data.stars}**`,    inline: true },
            { name: '🛡️ Shields',    value: `**${data.shields}**`,  inline: true },
            {
                name: '⚡ Double XP',
                value: data.doubleXpUntil > Date.now()
                    ? `**Active** (${Math.ceil((data.doubleXpUntil - Date.now()) / 60000)} daq)`
                    : '**Off**',
                inline: true,
            },
            { name: '🏷️ Title',      value: data.title ? `**${data.title}**` : '—', inline: true },
        )
        .setColor('#9b59b6');

    return message.reply({ embeds: [embed] });
};
