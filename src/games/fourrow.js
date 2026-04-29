// =====================================================================
// CIYAARTA 4-IN-A-ROW (Connect 4) — Garaad Bot
// • 2 ciyaartoy
// • 6 saf x 7 column board
// • Qofkii ugu horreeya 4 isugu xigxiga (jiif/taag/xagal) → wuu guulaystay
// • Su'aalo ma jiraan — XP kaliya guulaystaha ayaa qaadanaya
// =====================================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { userData, saveData, activeFourrow } = require('../store');
const { checkUser, addXp }                 = require('../utils/helpers');
const { markUserPlayed }                   = require('../utils/reminders');

// ───── Habayn ─────
const ROWS         = 6;
const COLS         = 7;
const TURN_TIME_MS  = 30 * 1000;           // 30 ilbiriqsi turn kasta
const WINNER_XP     = 25;                  // XP guulaystaha
const LOSER_XP      = 10;                  // XP laga jarayo lumiyaha
const MIN_XP_TO_PLAY = LOSER_XP;           // Ugu yaraan loo baahanyahay si la u ciyaaro
const NUM_EMOJI    = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣'];
const PIECE        = { p1: '🔴', p2: '🟡', empty: '⚫' };
// ⭐ U dhexeeyaha unugyada — em-space (\u2003) — wuxuu siinayaa kala-bax cad oo isku mid ah Discord mobile/desktop
const CELL_SEP     = '\u2003';
const SIDE_PAD     = '\u2003'; // hareeraha bidix iyo midig

// ───── Sameey board cusub ─────
function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// ───── Riix shey column gaar ah — soo celi rowIndex la galiyay ama -1 ─────
function dropPiece(board, col, who) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (!board[r][col]) {
            board[r][col] = who;
            return r;
        }
    }
    return -1; // column buuxa
}

// ───── Hubi haddii uu jiro 4 isugu xigxiga ee uu galiyay ─────
function checkWin(board, row, col, who) {
    const directions = [
        [0, 1],   // jiifa →
        [1, 0],   // taagan ↓
        [1, 1],   // xagal ↘
        [1, -1],  // xagal ↙
    ];
    for (const [dr, dc] of directions) {
        let count = 1;
        // ka socda hal dhanka
        for (let i = 1; i < 4; i++) {
            const r = row + dr * i, c = col + dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
            if (board[r][c] === who) count++; else break;
        }
        // ka socda dhanka kale
        for (let i = 1; i < 4; i++) {
            const r = row - dr * i, c = col - dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
            if (board[r][c] === who) count++; else break;
        }
        if (count >= 4) return true;
    }
    return false;
}

// ───── Hubi haddii board buuxo ─────
function isBoardFull(board) {
    return board[0].every(cell => cell !== null);
}

// ───── U sawir board emojis ─────
// • Em-space (\u2003) ayaa loo isticmaalay si pieces-ka u kala muuqdaan
// • Wadar walba waxaa ku jira "frame" hareeraha (📍 sare iyo 🔵 hoose)
function renderBoard(board) {
    const header = SIDE_PAD + NUM_EMOJI.join(CELL_SEP) + SIDE_PAD;
    const lines  = [header];
    for (const row of board) {
        const cells = row.map(cell => {
            if (cell === 'p1') return PIECE.p1;
            if (cell === 'p2') return PIECE.p2;
            return PIECE.empty;
        });
        lines.push(SIDE_PAD + cells.join(CELL_SEP) + SIDE_PAD);
    }
    return lines.join('\n');
}

// ───── Sameey button rows column kasta ─────
function buildButtons(state) {
    // 7 columns → 2 rows (4 + 3) — Discord max 5 button per row
    const rows = [];
    const r1 = new ActionRowBuilder();
    const r2 = new ActionRowBuilder();
    for (let c = 0; c < COLS; c++) {
        const colFull = state.board[0][c] !== null;
        const btn = new ButtonBuilder()
            .setCustomId(`4row_drop_${state.channelId}_${c}`)
            .setLabel(`${c + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(colFull || state.finished);
        if (c < 4) r1.addComponents(btn); else r2.addComponents(btn);
    }
    rows.push(r1, r2);
    return rows;
}

// ───── Bilow game cusub ─────
async function startFourrowGame(channel, p1Id, p2Id) {
    if (activeFourrow.has(channel.id)) return;

    checkUser(p1Id);
    checkUser(p2Id);
    markUserPlayed(p1Id);
    markUserPlayed(p2Id);

    const state = {
        channelId: channel.id,
        p1: p1Id, p2: p2Id,
        board: emptyBoard(),
        current: p1Id,           // p1 wuu bilaabayaa
        message: null,
        finished: false,
        turnTimer: null,
    };
    activeFourrow.set(channel.id, state);

    const embed = buildBoardEmbed(state, `🎮 Ciyaarta waa la bilaabay! ${PIECE.p1} <@${p1Id}> bilaabay.`);
    const msg = await channel.send({ embeds: [embed], components: buildButtons(state) }).catch(() => null);
    if (!msg) {
        activeFourrow.delete(channel.id);
        return;
    }
    state.message = msg;
    armTurnTimer(channel, state);
}

// ───── Sameey embed board-ka ─────
function buildBoardEmbed(state, statusLine) {
    const turnUser = state.current;
    const turnPiece = state.current === state.p1 ? PIECE.p1 : PIECE.p2;

    return new EmbedBuilder()
        .setTitle('🎯 4 Isku-xig — Garaad Bot')
        .setDescription(
            `${PIECE.p1} <@${state.p1}>  vs  ${PIECE.p2} <@${state.p2}>\n\n` +
            renderBoard(state.board) + '\n\n' +
            (state.finished
                ? statusLine
                : `${statusLine}\n\n👉 Turn-ka: ${turnPiece} <@${turnUser}> _(${TURN_TIME_MS / 1000}s)_`)
        )
        .setColor(state.finished ? '#95a5a6' : (state.current === state.p1 ? '#e74c3c' : '#f1c40f'));
}

// ───── Maaree turn timer ─────
function armTurnTimer(channel, state) {
    if (state.turnTimer) clearTimeout(state.turnTimer);
    state.turnTimer = setTimeout(() => handleTimeout(channel, state), TURN_TIME_MS);
}

async function handleTimeout(channel, state) {
    if (state.finished) return;
    const winner = state.current === state.p1 ? state.p2 : state.p1;
    const loser  = state.current;
    state.finished = true;
    activeFourrow.delete(channel.id);

    const lostXp = awardWinner(winner, loser);

    const embed = buildBoardEmbed(state,
        `⏰ <@${loser}> wakhti dhamaaday — wuu lumiyay!\n\n` +
        `🏆 Guulaystay: <@${winner}> (+${WINNER_XP} XP)\n` +
        `💀 Lumiyay: <@${loser}> (−${lostXp} XP)`
    );
    if (state.message) {
        await state.message.edit({ embeds: [embed], components: buildButtons(state) }).catch(() => {});
    }
}

// ───── Maaree button drop ─────
async function handleDrop(interaction) {
    const parts     = interaction.customId.split('_');         // ['4row','drop',channelId,col]
    const channelId = parts[2];
    const col       = parseInt(parts[3]);

    const state = activeFourrow.get(channelId);
    if (!state || state.finished) {
        return interaction.reply({ content: 'Ciyaartan way dhamaatay.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    if (interaction.user.id !== state.p1 && interaction.user.id !== state.p2) {
        return interaction.reply({ content: 'Adigu kuma jirtid ciyaartan.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    if (interaction.user.id !== state.current) {
        return interaction.reply({ content: '⏳ Sug — turn-kaagu maaha.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    if (col < 0 || col >= COLS) {
        return interaction.reply({ content: 'Column khalad.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }

    const who = state.current === state.p1 ? 'p1' : 'p2';
    const droppedRow = dropPiece(state.board, col, who);
    if (droppedRow === -1) {
        return interaction.reply({ content: 'Column-kani wuu buuxsamay.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }

    if (state.turnTimer) clearTimeout(state.turnTimer);

    // Hubi guul
    if (checkWin(state.board, droppedRow, col, who)) {
        const winner = state.current;
        const loser  = winner === state.p1 ? state.p2 : state.p1;
        state.finished = true;
        activeFourrow.delete(state.channelId);

        const lostXp = awardWinner(winner, loser);

        const embed = buildBoardEmbed(state,
            `🏆 <@${winner}> wuu guulaystay!\n` +
            `💎 +${WINNER_XP} XP — Mahadsanid ciyaarta!\n` +
            `💀 <@${loser}> −${lostXp} XP`
        );
        return interaction.update({ embeds: [embed], components: buildButtons(state) }).catch(() => {});
    }

    // Hubi draw
    if (isBoardFull(state.board)) {
        state.finished = true;
        activeFourrow.delete(state.channelId);

        checkUser(state.p1); checkUser(state.p2);
        userData[state.p1].stats.fourRowDraws = (userData[state.p1].stats.fourRowDraws || 0) + 1;
        userData[state.p2].stats.fourRowDraws = (userData[state.p2].stats.fourRowDraws || 0) + 1;
        saveData();

        const embed = buildBoardEmbed(state, `🤝 Board-ku wuu buuxsamay — ciyaartu waa equality!`);
        return interaction.update({ embeds: [embed], components: buildButtons(state) }).catch(() => {});
    }

    // Wareeji turn-ka
    state.current = state.current === state.p1 ? state.p2 : state.p1;
    armTurnTimer(interaction.channel, state);

    const turnPiece = state.current === state.p1 ? PIECE.p1 : PIECE.p2;
    const movedPiece = who === 'p1' ? PIECE.p1 : PIECE.p2;
    const embed = buildBoardEmbed(state,
        `${movedPiece} <@${interaction.user.id}> wuxuu galiyay column **${col + 1}**.`
    );
    return interaction.update({ embeds: [embed], components: buildButtons(state) }).catch(() => {});
}

// ───── Abaalmari guulaystaha + ciqaab lumiyaha ─────
// Soo celi inta XP ee laga jaray lumiyaha (si farriinta loogu muujiyo)
function awardWinner(winnerId, loserId) {
    checkUser(winnerId);
    checkUser(loserId);
    addXp(winnerId, WINNER_XP);

    const lostXp = Math.min(LOSER_XP, userData[loserId].xp);
    userData[loserId].xp = Math.max(0, userData[loserId].xp - LOSER_XP);

    userData[winnerId].stats.fourRowWins  = (userData[winnerId].stats.fourRowWins  || 0) + 1;
    userData[loserId].stats.fourRowLosses = (userData[loserId].stats.fourRowLosses || 0) + 1;
    saveData();
    return lostXp;
}

module.exports = { startFourrowGame, handleDrop, MIN_XP_TO_PLAY };
