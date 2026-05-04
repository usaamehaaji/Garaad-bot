const { EmbedBuilder } = require('discord.js');
const { getMarketSummary } = require('../games/marketManager');

module.exports = async function suuqCommand(message) {
    const market = getMarketSummary();
    const embed = new EmbedBuilder()
        .setTitle('📈 Suuqa Forex & Crypto')
        .setColor('#9b59b6')
        .setDescription(`${market.icon} Waxaa hadda jira: **${market.mood}**`)
        .addFields(
            { name: 'BTC', value: `$${market.btcPrice.toLocaleString()} (${market.trend.BTC >= 0 ? '+' : ''}${market.trend.BTC})`, inline: true },
            { name: 'EUR', value: `$${market.eurPrice.toLocaleString()} (${market.trend.EUR >= 0 ? '+' : ''}${market.trend.EUR})`, inline: true },
            { name: 'SOS / USD', value: `${market.sosRate.toLocaleString()} SOS = $1.00 (${market.trend.SOS >= 0 ? '+' : ''}${market.trend.SOS})`, inline: false },
        )
        .setFooter({ text: 'Suuqa ayaa si otomaatig ah u cusbooneysiinaya daqiiqad kasta.' });

    return message.reply({ embeds: [embed] });
};
