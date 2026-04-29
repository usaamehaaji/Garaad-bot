// =====================================================================
// AMARKA: ?4row @user (ama ?afar @user)
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { activeFourrow, isUserBusy } = require('../store');
const { PREFIX, GLOBAL_WAIT_MS }    = require('../config');

module.exports = async function fourrowCommand(message, args) {
    const userId = message.author.id;
    const target = message.mentions.users.first();

    if (!target)              return message.reply(`Isticmaal sidan: \`${PREFIX}4row @user\``);
    if (target.bot)           return message.reply('Bot lama dagaallami karo.');
    if (target.id === userId) return message.reply('Naftaada lama dagaallami kartid.');

    if (activeFourrow.has(message.channel.id)) {
        return message.reply('⚠️ Channel-kan mar hore ayaa ciyaar 4-row ka socota. Sug ilaa ay dhamaato.');
    }

    const issuerBusy = isUserBusy(userId);
    if (issuerBusy) {
        return message.reply(`⚠️ Waxaad mar hore ku jirtaa ciyaar **${issuerBusy}**! Sug ilaa ay dhammaato.`);
    }
    const targetBusy = isUserBusy(target.id);
    if (targetBusy) {
        return message.reply(`⚠️ <@${target.id}> wuxuu mar hore ku jiraa ciyaar **${targetBusy}**! Sug ilaa ay dhammaato.`);
    }

    const embed = new EmbedBuilder()
        .setTitle('🎯 4-Row Codsi')
        .setDescription(
            `<@${userId}> wuxuu ku casuumayaa <@${target.id}> ciyaarta **4 Isku-xig**!\n\n` +
            `**Sida ay u shaqayso:** Board 6×7 ah. Mid kasta isku day inuu sameeyo 4 sheyga ah oo isugu xigxiga (jiif, taagan, ama xagal).\n` +
            `**Wakhti turn:** 30 ilbiriqsi qof kasta\n` +
            `**Abaalgudka:** Guulaystaha → +25 XP. Lumiyaha → wax dhibaato ah ma jirto.\n\n` +
            `<@${target.id}>, ma aqbalaysaa? *(${GLOBAL_WAIT_MS / 1000} ilbiriqsi)*`
        )
        .setColor('#9b59b6');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`accept_4row_${userId}_${target.id}`)
            .setLabel('Aqbal ✅')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`decline_4row_${userId}_${target.id}`)
            .setLabel('Diid ❌')
            .setStyle(ButtonStyle.Danger),
    );

    const sent = await message.reply({
        content:    `${target}`,
        embeds:     [embed],
        components: [row],
        fetchReply: true,
    });

    setTimeout(async () => {
        try {
            const fresh = await sent.fetch().catch(() => null);
            if (!fresh || fresh.components.length === 0) return;
            await sent.edit({
                content:    '⏰ 4-Row codsigii waqti dhamaaday — laguma jawaabin.',
                embeds:     [],
                components: [],
            }).catch(() => {});
        } catch {}
    }, GLOBAL_WAIT_MS);
};
