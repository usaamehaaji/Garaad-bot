const { EmbedBuilder } = require('discord.js');
const { userData } = require('../store');
const { checkUser } = require('../utils/helpers');
const { getMarketState } = require('../games/marketManager');

function formatCurrency(value) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPortfolioValue(user, market) {
    return user.usdBalance
        + user.sosBalance / market.sosRate
        + (user.tradePortfolio.BTC || 0) * market.btcPrice
        + (user.tradePortfolio.EUR || 0) * market.eurPrice;
}

module.exports = async function jeebCommand(message, args) {
    const userId = message.author.id;
    checkUser(userId);

    const market = getMarketState();
    const lower = args[0] ? args[0].toLowerCase() : '';
    if (lower === 'top') {
        const leaderboard = Object.entries(userData)
            .map(([id, data]) => ({
                id,
                total: getPortfolioValue(data, market),
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        const description = leaderboard.length
            ? leaderboard
                  .map((entry, index) => `${index + 1}. <@${entry.id}> — $${formatCurrency(entry.total)}`)
                  .join('\n')
            : 'Wali ma jirto tartan ku filan.';

        const embed = new EmbedBuilder()
            .setTitle('🏆 Jeebkaaga - Hantida Suuqa')
            .setDescription(description)
            .setColor('#2ecc71')
            .setFooter({ text: 'Qiimaha hantida waxaa lagu xisaabiyaa USD iyo SOS / Crypto hadda.' });

        return message.reply({ embeds: [embed] });
    }

    const mention = message.mentions.users.first();
    const target = mention || message.author;
    const targetId = target.id;

    if (!userData[targetId]) {
        checkUser(targetId);
    }

    const user = userData[targetId];
    const portfolioUsd = getPortfolioValue(user, market);
    const hidden = user.hiddenUntil && user.hiddenUntil > Date.now();

    const embed = new EmbedBuilder()
        .setTitle(`💼 Jeebka ${target.username}`)
        .setColor('#3498db')
        .addFields(
            { name: 'USD', value: `$${formatCurrency(user.usdBalance)}`, inline: true },
            { name: 'SOS', value: `${user.sosBalance.toLocaleString()} SOS`, inline: true },
            { name: 'IQ', value: `${user.iq.toLocaleString()} IQ`, inline: true },
            { name: 'XP', value: `${user.xp.toLocaleString()} XP`, inline: true },
            { name: 'BTC', value: `${user.tradePortfolio.BTC || 0} BTC`, inline: true },
            { name: 'EUR', value: `${user.tradePortfolio.EUR || 0} EUR`, inline: true },
            { name: 'Hantida Guud (USD)', value: `$${formatCurrency(portfolioUsd)}`, inline: false },
            { name: 'Sirta', value: user.password ? 'Haa' : 'Maya', inline: true },
            { name: 'Dhumasho Hawlgawa', value: hidden ? 'Haa (qarsoon)' : 'Maya', inline: true },
        );

    return message.reply({ embeds: [embed] });
};
