const { userData, saveData } = require('../store');
const { checkUser } = require('../utils/helpers');

module.exports = async function dhumashoCommand(message) {
    const userId = message.author.id;
    checkUser(userId);

    const user = userData[userId];
    const cost = 10000;
    if (user.iq < cost) {
        return message.reply('Ma haysatid IQ ku filan si aad u qariso jeebkaaga. Waxaa loo baahan yahay 10,000 IQ.');
    }

    user.iq -= cost;
    user.hiddenUntil = Date.now() + 60 * 60 * 1000;
    saveData();

    return message.reply('🛡️ Jeebkaaga waa la qarxiyey 1 saac. Xatooyo hadda kama xadi karto lacagtaada ama SOS-kaaga.');
};
