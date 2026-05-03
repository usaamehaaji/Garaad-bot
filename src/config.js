// =====================================================================
// GARAAD BOT - Habaynta Guud (Config)
// =====================================================================

module.exports = {
    PREFIX: "?",

    // ───── Waqtiyo (Milliseconds) ─────
    TWO_WEEKS_MS:    14 * 24 * 60 * 60 * 1000,
    GLOBAL_WAIT_MS:  18000,             // ⭐ 18 ilbiriqsi — sugida ciyaartoyga (game walba)
    RUSH_TIME_MS:    14000,             // 14s su'aal kasta (Rush)
    QUIZ_QTIME_MS:   14000,             // 14s su'aal kasta (Quiz Koox)
    QUIZ_LOBBY_MS:   3 * 60 * 1000,     // 3 daqiiqo lobby
    REMINDER_HOURS:  24,                // ⭐ Saacadaha u dhexeeya DM xusuusinta

    // ───── Xadduudaha ciyaarta ─────
    HOST_DAILY_LIMIT:    5,
    QUIZ_QUESTION_COUNT: 10,            // (default — fallback)
    QUIZ_MIN_QUESTIONS:  3,             // ⭐ Ugu yar ee hostku dooran karo
    QUIZ_MAX_QUESTIONS:  25,            // ⭐ Ugu badan ee hostku dooran karo
    QUIZ_MIN_PLAYERS:    3,             // ⭐ Ugu yaraan 3 qof si la bilaabo
    QUIZ_MAX_PLAYERS:    100,           // ⭐ Cap sare oo qarsoon (ma xadidna oo dhab ah)
    LEVEL_STEP:          200,

    // ───── Solo: tirada su'aalaha ─────
    SOLO_MIN_QUESTIONS:     3,          // ⭐ Ugu yar ee user-ku dooran karo
    SOLO_MAX_QUESTIONS:     25,         // ⭐ Ugu badan ee user-ku dooran karo
    SOLO_DEFAULT_QUESTIONS: 13,         // Haddii uusan dooran

    // ───── Duel: tirada su'aalaha ─────
    DUEL_MIN_QUESTIONS:     3,          // ⭐ Ugu yar ee la dooran karo
    DUEL_MAX_QUESTIONS:     15,         // ⭐ Ugu badan ee la dooran karo
    DUEL_DEFAULT_QUESTIONS: 5,          // Haddii aysan wax dooran (fallback)
    DUEL_WRONG_PENALTY:     1,          // ⭐ IQ laga jaro qofka khaldaya su'aal kasta

    // ───── Rush: tirada su'aalaha ─────
    RUSH_MIN_QUESTIONS:     5,
    RUSH_MAX_QUESTIONS:     100,
    RUSH_DEFAULT_QUESTIONS: 30,
    RUSH_WRONG_PENALTY:     1,          // ⭐ IQ laga jaro marka uu khaldamo

    // ───── Tartan (admin martigelin) ─────
    TOURNAMENT_MIN_PLAYERS: 2,
    TOURNAMENT_R1_QUESTIONS: 30,
    TOURNAMENT_R2_QUESTIONS: 25,
    TOURNAMENT_FINAL_QUESTIONS: 20,

    // ───── IQ & XP abaalgudka ─────
    REWARDS: {
        solo:  { correct: { iq: +2, xp: +5  }, wrong: { iq: -1, xp: 0  }, timeout: { iq: -1 } },
        bet:   { win:     { iq: +20, xp: +10 }, lose:  { iq: "minus_bet" }                     },
        rush:  { correct: { xp: +2 }                                                            },
        duel:  { win:     { iq: +5, xp: +20 }, lose: { iq: -5 }, draw: {}                      },
        quiz:  { first:   { iq: +5, xp: +30 }, second: { iq: +3, xp: +20 }, third: { iq: +1, xp: +10 }, other: { xp: +3 } },
        daily: { iq: +3,  xp: +10 },
    },

    // ───── Dukaanka ─────
    SHOP_ITEMS: {
        shield:   { name: "🛡️ Difaaca IQ",      price: 50,  desc: "Hal mar haddii aad qaldid `?solo`, dhibic lagaama jarayo."          },
        double:   { name: "✨ Double XP",         price: 80,  desc: "1 saac gudahood, XP-gaaga waxaa la dhigayaa labo laab."             },
        profesor: { name: "🎓 Title: Profesor",   price: 150, desc: "Magacaaga waxaa ku dheggan noqonaya [Profesor]."                    },
        garaad:   { name: "👑 Title: Garaad",     price: 250, desc: "Magacaaga waxaa ku dheggan noqonaya [Garaad]."                      },
        caalin:   { name: "🧠 Title: Caalin",     price: 400, desc: "Magacaaga waxaa ku dheggan noqonaya [Caalin]."                      },
    },
};
