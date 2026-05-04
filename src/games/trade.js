// =====================================================================
// GARAAD BOT - Forex/Crypto Trading Game
// =====================================================================

const { userData, saveData, activeTrades } = require('../store');
const { EmbedBuilder } = require('discord.js');

function formatUsd(amount) {
    return `$${amount.toFixed(2)}`;
}

function formatAsset(amount, symbol) {
    return `${amount.toFixed(symbol === 'BTC' ? 3 : 0)} ${symbol}`;
}

function randomPercent() {
    return (Math.random() * 2 - 1) / 100;
}

function createTradeState(userId) {
    const existing = activeTrades.get(userId);
    if (existing) return existing;

    const state = {
        userId,
        prices: {
            BTC: 27500 + Math.random() * 5000,
            EUR: 1.05 + Math.random() * 0.15,
        },
        trend: {
            BTC: 0,
            EUR: 0,
        },
        lastUpdated: Date.now(),
    };

    activeTrades.set(userId, state);
    return state;
}

function getTradeState(userId) {
    return activeTrades.get(userId);
}

function refreshTradePrices(state) {
    if (!state) return;
    const assets = Object.keys(state.prices);
    assets.forEach(asset => {
        const change = randomPercent();
        const oldPrice = state.prices[asset];
        const newPrice = Math.max(oldPrice * (1 + change), asset === 'EUR' ? 0.5 : 1000);
        state.prices[asset] = newPrice;
        state.trend[asset] = newPrice - oldPrice;
    });
    state.lastUpdated = Date.now();
    return state;
}

function getPriceText(state, asset) {
    const price = state.prices[asset];
    const diff = state.trend[asset] || 0;
    const emoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
    const sign = diff > 0 ? '+' : '';
    return `${asset} • ${formatUsd(price)} ${emoji} (${sign}${diff.toFixed(asset === 'EUR' ? 4 : 2)})`;
}

function getShareAmount(asset) {
    return asset === 'BTC' ? 0.01 : 50;
}

function executeTrade(userId, assetKey, action) {
    const user = userData[userId];
    if (!user) return { success: false, message: 'Xogtaada lama helin. Fadlan mar kale isku day.' };
    const state = getTradeState(userId) || createTradeState(userId);
    const asset = assetKey.toUpperCase();
    const price = state.prices[asset];
    if (!price) {
        return { success: false, message: 'Asset-ka la doortay lama aqoonsan.' };
    }

    const unit = getShareAmount(asset);
    const cost = asset === 'EUR' ? price * unit : price * unit;
    const portfolio = user.tradePortfolio ?? { BTC: 0, EUR: 0 };

    if (action === 'buy') {
        if (user.usdBalance < cost) {
            return { success: false, message: `Ma haysid lacag ku filan. U baahan tahay ugu yaraan ${formatUsd(cost)}.` };
        }
        user.usdBalance -= cost;
        portfolio[asset] = (portfolio[asset] || 0) + unit;
        user.tradeHistory = user.tradeHistory || [];
        user.tradeHistory.unshift({
            when: new Date().toISOString(),
            type: 'Buy',
            asset,
            amount: unit,
            price: price,
            total: cost,
        });
        if (user.tradeHistory.length > 6) user.tradeHistory.pop();
        saveData();
        return { success: true, message: `✅ Waxaad iibsatay ${formatAsset(unit, asset)} ${asset} oo qiimo ahaan ${formatUsd(cost)}.` };
    }

    if (action === 'sell') {
        if ((portfolio[asset] || 0) < unit) {
            return { success: false, message: `Ma haysid ${formatAsset(unit, asset)} ${asset} si aad u iibiso.` };
        }
        portfolio[asset] -= unit;
        user.usdBalance += cost;
        user.tradeHistory = user.tradeHistory || [];
        user.tradeHistory.unshift({
            when: new Date().toISOString(),
            type: 'Sell',
            asset,
            amount: unit,
            price: price,
            total: cost,
        });
        if (user.tradeHistory.length > 6) user.tradeHistory.pop();
        saveData();
        return { success: true, message: `✅ Waxaad iibisay ${formatAsset(unit, asset)} ${asset} oo aad heshay ${formatUsd(cost)}.` };
    }

    return { success: false, message: 'Hawl aan sax ahayn la doortay.' };
}

function buildTradeEmbed(userId, state) {
    const user = userData[userId];
    if (!user) return null;
    const balanceText = formatUsd(user.usdBalance || 0);
    const btcHolding = formatAsset(user.tradePortfolio?.BTC || 0, 'BTC');
    const eurHolding = formatAsset(user.tradePortfolio?.EUR || 0, 'EUR');

    const history = (user.tradeHistory || []).slice(0, 4).map(entry => {
        const type = entry.type === 'Buy' ? 'Iibso' : 'Iibis';
        return `• ${type} ${formatAsset(entry.amount, entry.asset)} ${entry.asset} @ ${formatUsd(entry.price)} (${formatUsd(entry.total)})`;
    }).join('\n') || 'Ma wax macaamil ah weli ma jiro.';

    const embed = new EmbedBuilder()
        .setTitle('💱 ?trade — Forex iyo Crypto')
        .setDescription(`Suqyada waa cusubaan oo firfircoon. Isticmaal button-ka si aad u iibsato ama u iibiso.

` +
            `**Lacagtaada USD:** ${balanceText}\n` +
            `**Portfolio:** ${btcHolding}, ${eurHolding}\n\n` +
            `**Qiimaha hadda:**\n` +
            `${getPriceText(state, 'BTC')}\n` +
            `${getPriceText(state, 'EUR')}\n\n` +
            `**Taariikhda ugu dambeysay:**\n${history}`)
        .setColor('#1abc9c')
        .setFooter({ text: 'Haddii aad rabto xog cusub, riix Refresh.' });

    return embed;
}

module.exports = {
    createTradeState,
    getTradeState,
    refreshTradePrices,
    executeTrade,
    buildTradeEmbed,
};
