// =====================================================================
// SUB-AMARKA: ?admin give @user iq 10 xp 20
// =====================================================================

const { userData, saveData } = require('../../store');
const { checkUser, getLevel } = require('../../utils/helpers');

module.exports = async function adminGive(message, args) {
    let target = message.mentions.users.first();
    let idx = 0;

    if (!target && args[0] && /^\d{17,20}$/.test(args[0])) {
        target = await message.client.users.fetch(args[0]).catch(() => null);
        idx = 1;
    } else if (target) {
        idx = 1;
    }

    if (!target) {
        return message.reply('⚠️ Fadlan tilmaan user. Tusaale: `?admin give @user iq 10 xp 20`');
    }

    checkUser(target.id);

    let iqToAdd = null;
    let xpToAdd = null;
    const rest = args.slice(idx);

    for (let i = 0; i < rest.length; i++) {
        const key = (rest[i] || '').toLowerCase();
        const valRaw = rest[i + 1];
        const val = Number(valRaw);

        if (key !== 'iq' && key !== 'xp') continue;
        if (!Number.isFinite(val) || !Number.isInteger(val) || val < 0) {
            return message.reply(`⚠️ Qiimaha ${key.toUpperCase()} waa inuu noqdaa lambar sax ah oo aan tabanayn. Tusaale: \`${key} 10\``);
        }

        if (key === 'iq') iqToAdd = val;
        if (key === 'xp') xpToAdd = val;
        i++; // ka bood value-ga la isticmaalay
    }

    if (iqToAdd === null && xpToAdd === null) {
        return message.reply(
            '⚠️ Waxaad bixin kartaa `iq` ama `xp` (ama labadaba).\n' +
            'Tusaale: `?admin give @user iq 10` ama `?admin give @user xp 50` ama `?admin give @user iq 10 xp 50`'
        );
    }

    if (iqToAdd !== null) userData[target.id].iq += iqToAdd;
    if (xpToAdd !== null) userData[target.id].xp += xpToAdd;
    saveData();

    return message.reply(
        `✅ Waxaa la siiyay <@${target.id}> ` +
        `${iqToAdd !== null ? `**+${iqToAdd} IQ**` : ''}` +
        `${iqToAdd !== null && xpToAdd !== null ? ' iyo ' : ''}` +
        `${xpToAdd !== null ? `**+${xpToAdd} XP**` : ''}` +
        `.\nHadda: **${userData[target.id].iq} IQ** (Level ${getLevel(userData[target.id].iq)}) | **${userData[target.id].xp} XP**`
    );
};
