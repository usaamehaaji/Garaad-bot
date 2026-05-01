// =====================================================================
// GARAAD BOT - Maareynta Su'aalaha
// • Per-game pools (solo.json, duel.json, rush.json, quiz.json, bet.json)
// • Global text-based dedup per user (su'aal mar la arkay marna laguma soo celin)
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
// ⭐ GLOBAL SEEN BY TEXT (cusub — ka hortaga in su'aal isku mid ah ay
//    kasoo baxdo ciyaar walba)
// ─────────────────────────────────────────────────────────────────────
function getSeenTexts(userId) {
    checkUser(userId);
    if (!userData[userId].seenTexts) userData[userId].seenTexts = {};
    return userData[userId].seenTexts;
}

function cleanExpiredSeenTexts(userId) {
    const seen = getSeenTexts(userId);
    const now  = Date.now();
    for (const txt of Object.keys(seen)) {
        if (now - seen[txt] >= TWO_WEEKS_MS) delete seen[txt];
    }
}

// ─────────────────────────────────────────────────────────────────────
// Dooro su'aalo aan WELIGOOD la arkin (per-game + global text)
// ─────────────────────────────────────────────────────────────────────
function pickQuestionsForGame(userId, game, count) {
    cleanExpiredSeenForGame(userId, game);
    cleanExpiredSeenTexts(userId);

    let pool      = questionsByGame[game] || [];
    let seenIdx   = getSeenForGame(userId, game);
    const seenTxt = getSeenTexts(userId);

    // Haddii file game-kan uusan loadmin, ka faa'iidayso pool kale oo la heli karo.
    if (pool.length === 0) {
        const anyPool = Object.values(questionsByGame).find(arr => Array.isArray(arr) && arr.length > 0);
        if (anyPool) pool = anyPool;
    }

    // Haddii dhammaan pools madhan yihiin, isticmaal emergency pool.
    if (pool.length === 0) {
        pool = EMERGENCY_POOL;
    }

    // Dhis liiska su'aalaha aan horay loo arkin (game-kan)
    const buildUnseenIdx = () => {
        const unseen = [];
        for (let i = 0; i < pool.length; i++) {
            const q = pool[i];
            if (i in seenIdx)          continue;   // index horay loo arkay (game-kan)
            if (q.question in seenTxt) continue;   // text horay loo arkay (game KASTA)
            unseen.push(i);
        }
        return unseen;
    };

    let unseenIdx = buildUnseenIdx();

    // Haddii "unseen" dhammaado, dib u cusboonaysii raadinta game-kan oo kaliya
    // si user-ku su'aalo kala duwan arko halkii uu isla saddexda su'aalood arkayay.
    if (unseenIdx.length === 0) {
        // Nadiifi seenByGame game-kan si dib loogu bilaabo wareegga
        const gameSeenMap = userData[userId].seenByGame;
        if (gameSeenMap) gameSeenMap[game] = {};
        seenIdx   = getSeenForGame(userId, game);
        unseenIdx = buildUnseenIdx();
    }

    // Dooro su'aalaha, hubin in aan laba isku mid ah la soo qaadin hal call-ka
    const pickedIdx  = [];
    const usedInCall = new Set();

    if (unseenIdx.length > 0) {
        let bag = shuffleArray(unseenIdx);
        let ptr = 0;

        while (pickedIdx.length < count) {
            // Haddii bag-ka dhammaado, dib u cusboonaysii si loop-ku u sii socdo
            if (ptr >= bag.length) {
                bag = shuffleArray(Array.from({ length: pool.length }, (_, i) => i));
                ptr = 0;
            }

            const idx = bag[ptr++];

            // Ha soo qaadin su'aal horay loo doortay hal call-kan gudihiis
            if (usedInCall.has(idx)) continue;

            usedInCall.add(idx);
            pickedIdx.push(idx);
        }
    }

    return pickedIdx.map(i => ({ ...pool[i], _idx: i, _game: game }));
}

// ─────────────────────────────────────────────────────────────────────
// Calaamadee su'aal la arkay (per-game index + global text)
// ─────────────────────────────────────────────────────────────────────
function markSeenForGame(userId, game, idx) {
    if (idx === undefined || idx === null) return;
    const seen = getSeenForGame(userId, game);
    seen[idx]  = Date.now();

    // ⭐ Calaamadee text-ka si ay ciyaarta kale ugu kala mid ahaano
    const pool = questionsByGame[game] || [];
    const q    = pool[idx];
    if (q && q.question) {
        const seenTxt = getSeenTexts(userId);
        seenTxt[q.question] = Date.now();
    }
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
