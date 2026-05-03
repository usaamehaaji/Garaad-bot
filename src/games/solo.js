// =====================================================================
// CIYAARTA SOLO — Garaad Quiz
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { userData, saveData, activeGames } = require('../store');
const { checkUser, getLevel, addXp }      = require('../utils/helpers');
const { markSeenForGame }                 = require('../utils/questions');
const { markUserPlayed }                  = require('../utils/reminders');
const { GLOBAL_WAIT_MS }                  = require('../config');

async function sendQuestion(messageOrInteraction, qNumber, currentMsg = null) {
    const isInteraction = !!(messageOrInteraction.isButton && messageOrInteraction.isButton());
    const userId        = isInteraction ? messageOrInteraction.user.id : messageOrInteraction.author.id;
    const game          = activeGames.get(userId);
    const total         = game ? game.total : 13;

    // Ciyaartu waa dhammaatay
    if (!game || qNumber > total) {
        activeGames.delete(userId);
        checkUser(userId);
        markUserPlayed(userId);

        const finishEmbed = new EmbedBuilder()
            .setTitle('🏁 Wareeggu waa dhamaaday!')
            .setDescription(
                `### <@${userId}> waad dhamaysatay ${total} su'aalood.\n` +
                `IQ: **${userData[userId].iq}** | XP: **${userData[userId].xp}** | Level **${getLevel(userData[userId].iq)}**`
            )
            .setColor('#2ecc71');

        if (currentMsg) return currentMsg.edit({ embeds: [finishEmbed], components: [] });
        return messageOrInteraction.reply({ embeds: [finishEmbed] });
    }

    const q = game.questions[qNumber - 1];
    markSeenForGame(userId, 'solo', q._idx);
    saveData();

    const embed = new EmbedBuilder()
        .setTitle(`📊 Su'aal ${qNumber}/${total}`)
        .setDescription(`## ${q.question}\n\n⏱️ ${GLOBAL_WAIT_MS / 1000} ilbiriqsi`)
        .setColor('#0099ff');

    const buttons = q.options.map((opt, index) =>
        new ButtonBuilder()
            .setCustomId(`q_${qNumber}_${index}_${userId}_${opt === q.correct}`)
            .setLabel(opt)
            .setStyle(ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    let msg;
    if (currentMsg) {
        msg = await currentMsg.edit({ embeds: [embed], components: [row] });
    } else {
        msg = await messageOrInteraction.reply({ embeds: [embed], components: [row], fetchReply: true });
    }

    const filter    = i => i.user.id === userId;
    const collector = msg.createMessageComponentCollector({ filter, time: GLOBAL_WAIT_MS, max: 1 });

    collector.on('end', collected => {
        if (collected.size === 0) {
            // Wakhti dhammaaday
            userData[userId].iq = Math.max(0, userData[userId].iq - 1);
            userData[userId].stats.soloWrong++;
            saveData();

            const timeoutEmbed = EmbedBuilder.from(embed)
                .setFields({ name: 'Natiijo', value: '⏰ Wakhti dhammaaday (−1 IQ)' });

            msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            setTimeout(() => sendQuestion(messageOrInteraction, qNumber + 1, msg), 2000);
        }
    });
}

// ───── Butonka jawaabta (interaction handler-ka ayaa u yeedhaya) ─────
async function handleSoloAnswer(interaction) {
    const parts   = interaction.customId.split('_');
    const qNum    = parseInt(parts[1]);
    const ownerId = parts[3];
    const result  = parts[4]; // "true" ama "false"

    if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: 'Ciyaartaada qoro!', flags: 64 });
    }

    await interaction.deferUpdate();

    checkUser(ownerId);
    let msg = '';

    if (result === 'true') {
        userData[ownerId].iq += 2;
        addXp(ownerId, 5);
        userData[ownerId].stats.soloCorrect++;
        msg = `✅ SAX (+2 IQ / +5 XP) — Level ${getLevel(userData[ownerId].iq)}`;
    } else {
        if (userData[ownerId].shields > 0) {
            userData[ownerId].shields--;
            userData[ownerId].stats.soloWrong++;
            msg = '❌ QALAD — Laakiin 🛡️ Shield ayaa kuu daboolay! (Shield −1)';
        } else {
            userData[ownerId].iq = Math.max(0, userData[ownerId].iq - 1);
            userData[ownerId].stats.soloWrong++;
            msg = `❌ QALAD (−1 IQ) — Level ${getLevel(userData[ownerId].iq)}`;
        }
    }

    userData[ownerId].stats.soloPlayed++;
    saveData();

    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFields({ name: 'Natiijo', value: msg });

    await interaction.editReply({ embeds: [updatedEmbed], components: [] });

    setTimeout(() => sendQuestion(interaction, qNum + 1, interaction.message), 1500);
}

module.exports = { sendQuestion, handleSoloAnswer };
