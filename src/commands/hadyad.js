const { userData, saveData } = require('../store');
const { checkUser } = require('../utils/helpers');

module.exports = async function hadyadCommand(message, args) {
    const senderId = message.author.id;
    checkUser(senderId);

    const target = message.mentions.users.first();
    if (!target) {
        return message.reply('Fadlan sheeg qofka aad lacagta u dirayso: `?hadyad @user 1000 [iq|usd|sos]`.');
    }

    const targetId = target.id;
    if (targetId === senderId) {
        return message.reply('Ma isugu diri kartid naftaada hadiyad.');
    }

    const amountArg = args.find((arg) => /^\d+$/.test(arg));
    const currencyArg = args.find((arg) => /^(iq|usd|sos)$/i.test(arg));
    const amount = amountArg ? Number(amountArg) : 0;
    const currency = currencyArg ? currencyArg.toLowerCase() : 'sos';

    if (!amount || amount <= 0) {
        return message.reply('Fadlan geli qaddar sax ah oo lacag ah. Tusaale: `?hadyad @user 1000 sos`.');
    }

    const sender = userData[senderId];
    const receiver = userData[targetId] || {};
    if (!receiver || !receiver.id) {
        // Ensure target exists in user data.
        userData[targetId] = { ...sender, id: targetId, password: null };
    }

    if (currency === 'iq') {
        if (sender.iq < amount) {
            return message.reply('Ma haysatid IQ ku filan si aad u dirto hadiyad.');
        }
        sender.iq -= amount;
        userData[targetId].iq += amount;
    } else if (currency === 'usd') {
        if (sender.usdBalance < amount) {
            return message.reply('Ma haysatid USD ku filan si aad u dirto hadiyad.');
        }
        sender.usdBalance -= amount;
        userData[targetId].usdBalance += amount;
    } else {
        if (sender.sosBalance < amount) {
            return message.reply('Ma haysatid SOS ku filan si aad u dirto hadiyad.');
        }
        sender.sosBalance -= amount;
        userData[targetId].sosBalance += amount;
    }

    saveData();
    return message.reply(`🎁 Hadiyad ayaa la diray: ${amount.toLocaleString()} ${currency.toUpperCase()} loo diray <@${targetId}>.`);
};
