// =====================================================================
// GARAAD BOT - Shaqooyinka Gargaarka (Helper Functions)
// =====================================================================

const { userData, saveData } = require('../store');
const { LEVEL_STEP }         = require('../config');

// ───── Taariikhda maalinta ─────
function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// ───── U diyaari isticmaale cusub haddii aanu jirin ─────
function checkUser(userId) {
    if (!userData[userId]) {
        userData[userId] = {
            iq: 0, xp: 0, lastDaily: 0,
            shields: 0, doubleXpUntil: 0, title: null, stars: 0,
            seenQuestions: {},                     // (legacy)
            seenByGame: { solo: {}, duel: {}, rush: {}, quiz: {}, bet: {} },
            lastPlayed:    0,                      // ⭐ Reminder: waqtigii ugu dambeeyay ee uu ciyaaray
            lastReminderSent: 0,                   // ⭐ Reminder: waqtigii DM ugu dambeeyay
            hostQuota: { date: todayKey(), count: 0 },
            stats: {
                soloPlayed: 0, soloCorrect: 0, soloWrong: 0,
                duelWins: 0, duelLosses: 0, duelDraws: 0,
                betsWon: 0, betsLost: 0,
                rushBest: 0,
                quizWins: 0, quizPlayed: 0,
                fourRowWins: 0, fourRowLosses: 0, fourRowDraws: 0,
                bugsReported: 0,
            },
        };
    } else {
        // Buuxi meelaha maqan (isticmaalayaasha hore)
        const d = userData[userId];
        d.iq               ??= 0;
        d.xp               ??= 0;
        d.lastDaily        ??= 0;
        d.shields          ??= 0;
        d.doubleXpUntil    ??= 0;
        d.title            ??= null;
        d.stars            ??= 0;
        d.seenQuestions    ??= {};
        d.seenByGame       ??= { solo: {}, duel: {}, rush: {}, quiz: {}, bet: {} };
        d.seenByGame.solo  ??= {};
        d.seenByGame.duel  ??= {};
        d.seenByGame.rush  ??= {};
        d.seenByGame.quiz  ??= {};
        d.seenByGame.bet   ??= {};
        d.lastPlayed       ??= 0;
        d.lastReminderSent ??= 0;
        d.hostQuota        ??= { date: todayKey(), count: 0 };
        d.stats            ??= {};
        const s = d.stats;
        s.soloPlayed    ??= 0;
        s.soloCorrect   ??= 0;
        s.soloWrong     ??= 0;
        s.duelWins      ??= 0;
        s.duelLosses    ??= 0;
        s.duelDraws     ??= 0;
        s.betsWon       ??= 0;
        s.betsLost      ??= 0;
        s.rushBest      ??= 0;
        s.quizWins      ??= 0;
        s.quizPlayed    ??= 0;
        s.fourRowWins   ??= 0;
        s.fourRowLosses ??= 0;
        s.fourRowDraws  ??= 0;
        s.bugsReported  ??= 0;
    }
}

// ───── Heer (Level) ─────
function getLevel(iq) {
    return Math.floor((iq || 0) / LEVEL_STEP);
}

// ───── XP ku dar (Double XP la xisaabiyaa) ─────
function addXp(userId, amount) {
    checkUser(userId);
    const mult = userData[userId].doubleXpUntil > Date.now() ? 2 : 1;
    userData[userId].xp += amount * mult;
}

// ───── Kala dardar array ─────
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = { todayKey, checkUser, getLevel, addXp, shuffleArray, saveData };
