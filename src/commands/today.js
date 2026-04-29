// =====================================================================
// AMARKA: ?today  (dhibco maalinlaha ah)
// =====================================================================

const { userData, saveData } = require('../store');
const { checkUser, addXp }   = require('../utils/helpers');
const { REWARDS }            = require('../config');

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 saacadood

module.exports = async function todayCommand(message) {
    const userId    = message.author.id;
    checkUser(userId);

    const lastDaily     = userData[userId].lastDaily || 0;
    const timeRemaining = COOLDOWN_MS - (Date.now() - lastDaily);

    if (timeRemaining > 0) {
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const mins  = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        return message.reply(`⏳ **Cooldown!** ${hours} saac iyo ${mins} daqiiqo kadib isku day.`);
    }

    userData[userId].iq         += REWARDS.daily.iq;
    userData[userId].lastDaily   = Date.now();
    addXp(userId, REWARDS.daily.xp);
    saveData();

    return message.reply(`🎁 Waxaad heshay **+${REWARDS.daily.iq} IQ** iyo **+${REWARDS.daily.xp} XP**. Mahadsanid!`);
};
