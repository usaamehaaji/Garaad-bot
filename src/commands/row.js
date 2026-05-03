// =====================================================================
// AMARKA: ?row @user
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { activeRows, isUserBusy, userData, saveData } = require('../store');
const { PREFIX } = require('../config');

module.exports = async function rowCommand(message, args) {
    const author = message.author;
    const target = message.mentions.users.first();

    if (!target) {
        return message.reply('Fadlan tilmaam adeegsiga: `' + PREFIX + 'row @user`.');
    }

    if (target.id === author.id) {
        return message.reply('Waxaad iskaa isku casuumi karin. Dooro user kale.');
    }

    const channelId = message.channel.id;

    if (activeRows.has(channelId)) {
        return message.reply('Kani channel horey wuxuu ku jiraa ciyaar ama casuumaad Row. Sug ilaa ay dhammaato.');
    }

    if (isUserBusy(author.id)) {
        return message.reply('Waxaad horey ciyaar ku jirtaa, dhamee ka hor intaadan bilaabin ?row.');
    }

    if (isUserBusy(target.id)) {
        return message.reply(`${target.username} hadda ciyaar ama hawl kale ayuu ku jiraa.`);
    }

    const embed = new EmbedBuilder()
        .setTitle('?row @user — Casuumaad')
        .setDescription(`${author} ayaa casuumay ${target} inuu ku ciyaaro 4-in-a-row.

Haddii ${target} uu aqbalo, ciyaarta waxay bilaaban doontaa isla channel-kan.`)
        .setColor('#f1c40f')
        .setFooter({ text: '4-In-A-Row | Accept or Decline' });

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`row_accept_${channelId}_${author.id}_${target.id}`)
            .setLabel('Aqbal')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`row_decline_${channelId}_${author.id}_${target.id}`)
            .setLabel('Diid')
            .setStyle(ButtonStyle.Danger),
    );

    const inviteMessage = await message.reply({ embeds: [embed], components: [buttons] });

    activeRows.set(channelId, {
        status: 'invited',
        inviterId: author.id,
        targetId: target.id,
        messageId: inviteMessage.id,
        channelId,
        createdAt: Date.now(),
    });
};
