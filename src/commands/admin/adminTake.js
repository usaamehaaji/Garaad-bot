// =====================================================================
// SUB-AMARKA: ?admin take @user iq 10 xp 20
// =====================================================================

const { userData, saveData } = require('../../store');
const { checkUser, getLevel } = require('../../utils/helpers');

module.exports = async function adminTake(message, args) {
    let target = message.mentions.users.first();
    let idx = 0;

    if (!target && args[0] && /^\d{17,20}$/.test(args[0])) {
        target = await message.client.users.fetch(args[0]).catch(() => null);
        idx = 1;
    } else if (target) {
        idx = 1;
    }

    if (!target) {
        return message.reply('⚠️ Fadlan tilmaan user. Tusaale: `?admin take @user iq 10 xp 20`');
    }

    checkUser(target.id);

    let iqToTake = null;
    let xpToTake = null;
    const rest = args.slice(idx);

    for (let i = 0; i < rest.length; i++) {
        const key = (rest[i] || '').toLowerCase();
        const valRaw = rest[i + 1];
        const val = Number(valRaw);

        if (key !== 'iq' && key !== 'xp') continue;
        if (!Number.isFinite(val) || !Number.isInteger(val) || val < 0) {
            return message.reply(`⚠️ Qiimaha ${key.toUpperCase()} waa inuu noqdaa lambar sax ah oo aan tabanayn. Tusaale: \`${key} 10\``);
        }

        if (key === 'iq') iqToTake = val;
        if (key === 'xp') xpToTake = val;
        i++;
    }

    if (iqToTake === null && xpToTake === null) {
        return message.reply(
            '⚠️ Waxaad bixin kartaa `iq` ama `xp` (ama labadaba).\n' +
            'Tusaale: `?admin take @user iq 10` ama `?admin take @user xp 50` ama `?admin take @user iq 10 xp 50`'
        );
    }

    const iqRemoved = iqToTake !== null ? Math.min(iqToTake, userData[target.id].iq) : 0;
    const xpRemoved = xpToTake !== null ? Math.min(xpToTake, userData[target.id].xp) : 0;

    if (iqToTake !== null) userData[target.id].iq = Math.max(0, userData[target.id].iq - iqToTake);
    if (xpToTake !== null) userData[target.id].xp = Math.max(0, userData[target.id].xp - xpToTake);
    saveData();

    return message.reply(
        `✅ Waxaa laga jaray <@${target.id}> ` +
        `${iqToTake !== null ? `**-${iqRemoved} IQ**` : ''}` +
        `${iqToTake !== null && xpToTake !== null ? ' iyo ' : ''}` +
        `${xpToTake !== null ? `**-${xpRemoved} XP**` : ''}` +
        `.\nHadda: **${userData[target.id].iq} IQ** (Level ${getLevel(userData[target.id].iq)}) | **${userData[target.id].xp} XP**`
    );
};
