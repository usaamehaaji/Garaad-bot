// =====================================================================
// AMARKA: ?trade / ?forex / ?crypto
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createTradeState, buildTradeEmbed, refreshTradePrices } = require('../games/trade');
const { checkUser } = require('../utils/helpers');

module.exports = async function tradeCommand(message) {
    const userId = message.author.id;
    checkUser(userId);

    const state = createTradeState(userId);
    refreshTradePrices(state);
    const embed = buildTradeEmbed(userId, state);

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`trade_buy_BTC_${userId}`)
            .setLabel('Iibso BTC')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`trade_sell_BTC_${userId}`)
            .setLabel('Iibi BTC')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`trade_buy_EUR_${userId}`)
            .setLabel('Iibso EUR')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`trade_sell_EUR_${userId}`)
            .setLabel('Iibi EUR')
            .setStyle(ButtonStyle.Danger),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`trade_refresh_${userId}`)
            .setLabel('Refresh')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`trade_close_${userId}`)
            .setLabel('Xidh')
            .setStyle(ButtonStyle.Danger),
    );

    return message.reply({ embeds: [embed], components: [row1, row2] });
};
