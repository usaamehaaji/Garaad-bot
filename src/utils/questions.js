// =====================================================================
// GARAAD BOT - Maareynta Su'aalaha
// • Per-game pools (solo.json, duel.json, rush.json, quiz.json, bet.json)
// • Per-game index tracking (su'aal kasta waxay leedahay wareeg madaxbannaan)
// =====================================================================

const fs   = require('fs');
const path = require('path');
const { EmbedBuilder }            = require('discord.js');
const { userData }                = require('../store');
const { checkUser, shuffleArray } = require('./helpers');
const { TWO_WEEKS_MS }            = require('../config');

// Emergency fallback haddii faylasha su'aalaha dhammaantood fashilmaan.
const EMERGENCY_POOL = [
    { question: 'Waa maxay 2 + 2?', options: ['3', '4', '5', '6'], correct: '4' },
    { question: 'Caasimadda Soomaaliya waa?', options: ['Hargeysa', 'Muqdisho', 'Boosaaso', 'Baydhabo'], correct: 'Muqdisho' },
    { question: 'Waa maxay 5 x 5?', options: ['20', '25', '30', '35'], correct: '25' },
];

// ───── Soo akhri su'aalaha game kasta ─────
const GAMES = ['solo', 'duel', 'rush', 'quiz', 'bet'];
const questionsByGame = {};

let fallback = [];
try {
    fallback = require('../../data/questions.json');
} catch (_) {
    // Faylka guud mar dambe lama isticmaalo — per-game files ayaa la isticmaalayaa
}

for (const game of GAMES) {
    try {
        const file = path.join(__dirname, '..', '..', 'data', 'questions', `${game}.json`);
        questionsByGame[game] = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        console.warn(`[Questions] Faylka ${game}.json lama helin — fallback la isticmaalay`);
        questionsByGame[game] = fallback;
    }
}

// ─────────────────────────────────────────────────────────────────────
// PER-GAME SEEN INDEX (la haystaa kuwii hore)
// ─────────────────────────────────────────────────────────────────────
function getSeenForGame(userId, game) {
    checkUser(userId);
    if (!userData[userId].seenByGame[game]) userData[userId].seenByGame[game] = {};
    return userData[userId].seenByGame[game];
}

function cleanExpiredSeenForGame(userId, game) {
    const seen = getSeenForGame(userId, game);
    const now  = Date.now();
    for (const idx of Object.keys(seen)) {
        if (now - seen[idx] >= TWO_WEEKS_MS) delete seen[idx];
    }
}

// ─────────────────────────────────────────────────────────────────────
// Dooro su'aalo aan la arkin (per-game index tracking kaliya)
// ─────────────────────────────────────────────────────────────────────
function pickQuestionsForGame(userId, game, count) {
    cleanExpiredSeenForGame(userId, game);

    let pool        = questionsByGame[game] || [];
    const seenIdx   = getSeenForGame(userId, game);
    const unseenIdx = [];

    // Haddii file game-kan uusan loadmin, ka faa'iidayso pool kale oo la heli karo.
    if (pool.length === 0) {
        const anyPool = Object.values(questionsByGame).find(arr => Array.isArray(arr) && arr.length > 0);
        if (anyPool) pool = anyPool;
    }

    for (let i = 0; i < pool.length; i++) {
        if (i in seenIdx) continue;     // index horay loo arkay (game-kan)
        unseenIdx.push(i);
    }

    // Haddii dhammaan pools madhan yihiin, isticmaal emergency pool.
    if (pool.length === 0) {
        pool = EMERGENCY_POOL;
    }

    // Haddii user-ku dhammeeyo su'aalaha game-kan, dib u bilow wareegga:
    // nadiifi seenByGame[game] oo dib u dhis unseenIdx ka pool-ka oo dhan.
    let sourceIdx;
    if (unseenIdx.length > 0) {
        sourceIdx = unseenIdx;
    } else {
        userData[userId].seenByGame[game] = {};
        sourceIdx = Array.from({ length: pool.length }, (_, i) => i);
    }

    // Had iyo jeer celi tiradii la codsaday, xitaa haddii pool-ku yar yahay
    // (su'aalaha waa la soo celinayaa / repeat).
    const pickedIdx = [];
    if (sourceIdx.length > 0) {
        let bag = shuffleArray(sourceIdx);
        let ptr = 0;
        while (pickedIdx.length < count) {
            if (ptr >= bag.length) {
                bag = shuffleArray(sourceIdx);
                ptr = 0;
            }
            pickedIdx.push(bag[ptr]);
            ptr++;
        }
    }

    return pickedIdx.map(i => ({ ...pool[i], _idx: i, _game: game }));
}

// ─────────────────────────────────────────────────────────────────────
// Calaamadee su'aal la arkay (per-game index kaliya)
// ─────────────────────────────────────────────────────────────────────
function markSeenForGame(userId, game, idx) {
    if (idx === undefined || idx === null) return;
    const seen = getSeenForGame(userId, game);
    seen[idx]  = Date.now();
}

function markSeenForUsersInGame(userIds, game, idx) {
    for (const uid of userIds) markSeenForGame(uid, game, idx);
}

// ───── Embed: su'aalo ma haray ─────
function noQuestionsLeftEmbed(username) {
    return new EmbedBuilder()
        .setTitle("📚 Su'aalihii waa dhammaadeen")
        .setDescription(
            `**${username}**, sualaha aad u baahnayd waad dhameystay.\n\n` +
            `⏳ Sug ilaa la cusboonaysiiyo — su'aalo cusub ayaa kuu furmaya kadib marka muddada laba toddobaad ee hore ka dhammaato.\n\n` +
            `Mahadsanid xamaasada aad muujisay! 👑`
        )
        .setColor('#95a5a6');
}

// ───── BACKWARD COMPAT (legacy API) ─────
const pickUnseenQuestions = (userId, count) => pickQuestionsForGame(userId, 'solo', count);
const pickUnseenForGroup  = (hostId, count) => pickQuestionsForGame(hostId, 'quiz', count);
const markSeen            = (userId, idx)   => markSeenForGame(userId, 'solo', idx);
const markSeenForUsers    = (userIds, idx)  => markSeenForUsersInGame(userIds, 'quiz', idx);

module.exports = {
    pickQuestionsForGame,
    markSeenForGame,
    markSeenForUsersInGame,
    pickUnseenQuestions,
    pickUnseenForGroup,
    markSeen,
    markSeenForUsers,
    noQuestionsLeftEmbed,
};
