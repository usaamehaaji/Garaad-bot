// =====================================================================
// GARAAD BOT - Forex/Crypto Trading Game
// =====================================================================

const { userData, saveData } = require('../store');
const { EmbedBuilder } = require('discord.js');
const { getMarketState } = require('./marketManager');
const { addXp } = require('../utils/helpers');

function formatUsd(amount) {
    return `$${amount.toFixed(2)}`;
}

function formatAsset(amount, symbol) {
    return `${amount.toFixed(symbol === 'BTC' ? 3 : 0)} ${symbol}`;
}

function randomPercent() {
    return (Math.random() * 2 - 1) / 100;
}

function getPriceText(asset, price, diff) {
    const emoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
    const sign = diff > 0 ? '+' : '';
    return `${asset} • ${formatUsd(price)} ${emoji} (${sign}${diff.toFixed(asset === 'EUR' ? 4 : 2)})`;
}

function getShareAmount(asset) {
    return asset === 'BTC' ? 0.01 : 50;
}

function calculateAverageBasis(user, asset, amountBought, cost) {
    const previousAmount = user.tradePortfolio[asset] || 0;
    const previousBasis = user.tradeBasis[asset] || 0;
    if (previousAmount <= 0) return cost / amountBought;
    return ((previousBasis * previousAmount) + cost) / (previousAmount + amountBought);
}

function addTradeXp(userId, amount) {
    const xpGain = Math.max(5, Math.floor(amount / 30));
    addXp(userId, xpGain);
}

function executeTrade(userId, assetKey, action) {
    const user = userData[userId];
    if (!user) return { success: false, message: 'Xogtaada lama helin. Fadlan mar kale isku day.' };

    const asset = assetKey.toUpperCase();
    const market = getMarketState();
    const price = asset === 'BTC' ? market.btcPrice : asset === 'EUR' ? market.eurPrice : 0;
    if (!price) {
        return { success: false, message: 'Asset-ka la doortay lama aqoonsan.' };
    }

    const unit = getShareAmount(asset);
    const cost = price * unit;
    const portfolio = user.tradePortfolio;

    if (action === 'buy') {
        if (user.usdBalance < cost) {
            return { success: false, message: `Ma haysid lacag ku filan. U baahan tahay ugu yaraan ${formatUsd(cost)}.` };
        }
        user.usdBalance -= cost;
        portfolio[asset] = (portfolio[asset] || 0) + unit;
        user.tradeBasis[asset] = calculateAverageBasis(user, asset, unit, cost);
        user.tradeHistory = user.tradeHistory || [];
        user.tradeHistory.unshift({
            when: new Date().toISOString(),
            type: 'Buy',
            asset,
            amount: unit,
            price,
            total: cost,
        });
        if (user.tradeHistory.length > 6) user.tradeHistory.pop();
        saveData();
        addTradeXp(userId, cost);
        return { success: true, message: `✅ Waxaad iibsatay ${formatAsset(unit, asset)} ${asset} oo qiimo ahaan ${formatUsd(cost)}.` };
    }

    if (action === 'sell') {
        if ((portfolio[asset] || 0) < unit) {
            return { success: false, message: `Ma haysid ${formatAsset(unit, asset)} ${asset} si aad u iibiso.` };
        }
        const avgBasis = user.tradeBasis[asset] || price;
        const pnl = cost - avgBasis;
        portfolio[asset] -= unit;
        if (portfolio[asset] <= 0) {
            portfolio[asset] = 0;
            user.tradeBasis[asset] = 0;
        }
        user.usdBalance += cost;
        user.tradeRealized += pnl;
        user.tradeHistory = user.tradeHistory || [];
        user.tradeHistory.unshift({
            when: new Date().toISOString(),
            type: 'Sell',
            asset,
            amount: unit,
            price,
            total: cost,
            pnl,
        });
        if (user.tradeHistory.length > 6) user.tradeHistory.pop();
        saveData();
        addTradeXp(userId, Math.max(5, Math.floor(Math.abs(pnl) / 5)));
        const resultText = pnl >= 0 ? `Waxaad ka faa'iideysatay ${formatUsd(pnl)}.` : `Khasaaro ${formatUsd(Math.abs(pnl))} ayuu kugu dhacay.`;
        return { success: true, message: `✅ Waxaad iibisay ${formatAsset(unit, asset)} ${asset} oo aad heshay ${formatUsd(cost)}. ${resultText}` };
    }

    return { success: false, message: 'Hawl aan sax ahayn la doortay.' };
}

function buildTradeEmbed(userId) {
    const user = userData[userId];
    if (!user) return null;
    const market = getMarketState();
    const balanceText = formatUsd(user.usdBalance || 0);
    const btcHolding = formatAsset(user.tradePortfolio?.BTC || 0, 'BTC');
    const eurHolding = formatAsset(user.tradePortfolio?.EUR || 0, 'EUR');
    const btcValue = (user.tradePortfolio.BTC || 0) * market.btcPrice;
    const eurValue = (user.tradePortfolio.EUR || 0) * market.eurPrice;
    const portfolioValue = btcValue + eurValue;
    const secretLabel = market.secretDay ? '🚀 Secret High-Value Day' : '📉 Normal Day';

    const history = (user.tradeHistory || []).slice(0, 4).map(entry => {
        const type = entry.type === 'Buy' ? 'Iibso' : 'Iibis';
        const pnlText = entry.type === 'Sell' ? ` | P/L: ${formatUsd(entry.pnl || 0)}` : '';
        return `• ${type} ${formatAsset(entry.amount, entry.asset)} ${entry.asset} @ ${formatUsd(entry.price)} (${formatUsd(entry.total)})${pnlText}`;
    }).join('\n') || 'Ma wax macaamil ah weli ma jiro.';

    const embed = new EmbedBuilder()
        .setTitle('💱 ?trade — Forex iyo Crypto')
        .setDescription('Suqyada waa cusubaan oo firfircoon. Isticmaal button-ka si aad u iibsato ama u iibiso.')
        .setColor('#1abc9c')
        .addFields(
            { name: 'Lacagtaada USD', value: balanceText, inline: true },
            { name: 'Portfolio Crypto', value: `${btcHolding}, ${eurHolding}`, inline: true },
            { name: 'Qiimaha Portfolio', value: `${formatUsd(portfolioValue)}`, inline: true },
            { name: 'BTC', value: `${formatUsd(market.btcPrice)} (${market.trend.BTC >= 0 ? '+' : ''}${market.trend.BTC.toFixed(2)})`, inline: true },
            { name: 'EUR', value: `${formatUsd(market.eurPrice)} (${market.trend.EUR >= 0 ? '+' : ''}${market.trend.EUR.toFixed(4)})`, inline: true },
            { name: 'SOS / USD', value: `${market.sosRate.toLocaleString()} SOS = $1.00`, inline: true },
            { name: 'Maalin Suuq', value: secretLabel, inline: true },
            { name: 'Qiimaha Purchase', value: `BTC: ${formatUsd(user.tradeBasis.BTC || 0)} / EUR: ${formatUsd(user.tradeBasis.EUR || 0)}`, inline: true },
            { name: 'Realized P/L', value: formatUsd(user.tradeRealized || 0), inline: true },
            { name: 'Taariikhda Ugu Dambeysay', value: history, inline: false },
        )
        .setFooter({ text: 'Riix Refresh si aad u hesho xog cusub oo la cusbooneysiiyay.' });

    return embed;
}

module.exports = {
    executeTrade,
    buildTradeEmbed,
};
