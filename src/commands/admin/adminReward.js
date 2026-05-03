// =====================================================================
// AMARKA: ?admin reward @user <tiro>  |  ?admin reward @user xp <tiro>
// =====================================================================

const { userData, saveData } = require('../../store');
const { checkUser, addXp, getLevel } = require('../../utils/helpers');

module.exports = async function adminReward(message, args) {
    const target = message.mentions.users.first();
    if (!target) {
        return message.reply('Tusaale: `?admin reward @user 50` ama `?admin reward @user xp 100`');
    }

    const rest = args.filter((a) => !/<@!?(\d+)>/.test(a));
    if (rest[0]?.toLowerCase() === 'xp') {
        const amt = parseInt(rest[1], 10);
        if (Number.isNaN(amt) || amt <= 0) {
            return message.reply('Tusaale: `?admin reward @user xp 100`');
        }
        checkUser(target.id);
        addXp(target.id, amt);
        saveData();
        return message.reply(`✅ <@${target.id}> wuxuu helay **+${amt} XP**. (Wadarta XP: **${userData[target.id].xp}**)`);
    }

    const iqAmt = parseInt(rest[0], 10);
    if (Number.isNaN(iqAmt)) {
        return message.reply('Tusaale: `?admin reward @user 50` ama `?admin reward @user xp 100`');
    }

    checkUser(target.id);
    userData[target.id].iq = Math.max(0, userData[target.id].iq + iqAmt);
    saveData();

    return message.reply(
        `✅ <@${target.id}> IQ waa la cusbooneysiiyay **${iqAmt >= 0 ? '+' : ''}${iqAmt}** ` +
        `(hadda **${userData[target.id].iq}**, Level ${getLevel(userData[target.id].iq)})`
    );
};
